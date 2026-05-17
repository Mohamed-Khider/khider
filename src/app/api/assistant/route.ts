import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

import { PROFILE } from '../../../data/PROFILE';

const DOCS_PATH = path.join(process.cwd(), 'src', 'data', 'custom_docs.json');
const EMB_PATH = path.join(process.cwd(), 'src', 'data', 'embeddings.json');

async function readDocs() {
  try {
    const raw = await fs.readFile(DOCS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function readEmbeddings() {
  try {
    const raw = await fs.readFile(EMB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function writeEmbeddings(data: any[]) {
  await fs.mkdir(path.dirname(EMB_PATH), { recursive: true });
  await fs.writeFile(EMB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function ensureEmbeddings(candidates: { id: string; text: string; source: string }[], apiKey?: string) {
  if (!apiKey) return [];
  const existing = await readEmbeddings();
  const map = new Map(existing.map((e: any) => [e.id, e]));
  const missing = candidates.filter(c => !map.has(c.id));
  if (missing.length === 0) return existing;

  // batch embed missing texts
  const inputs = missing.map(m => m.text);
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs })
  });
  const json = await res.json();
  const embeddings = json.data.map((d: any, i: number) => ({ id: missing[i].id, text: missing[i].text, source: missing[i].source, embedding: d.embedding }));
  const combined = existing.concat(embeddings);
  await writeEmbeddings(combined);
  return combined;
}

export async function POST(request: Request) {
  const body = await request.json();
  const q: string = body.query || '';
  if (!q) return NextResponse.json({ answer: '', source: '' });

  const docs = await readDocs();

  // Build candidate documents with stable ids
  const candidates: { id: string; text: string; source: string }[] = [
    { id: 'summary', text: PROFILE.summary, source: 'Summary' },
    ...PROFILE.skills.map((s, i) => ({ id: `skill-${i}`, text: s, source: 'Skills' })),
    ...PROFILE.projects.map((p, i) => ({ id: `project-${i}`, text: p.summary, source: `Project • ${p.title}` })),
    ...docs.map((d: any, i: number) => ({ id: `custom-${i}-${d.id || Date.now()}`, text: d.text, source: d.source || 'Custom' })),
  ];

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    // fallback to simple keyword scoring
    const ql = q.toLowerCase();
    let best = { score: 0, text: PROFILE.summary, source: 'Summary (fallback)' };
    for (const c of candidates) {
      const score = c.text.toLowerCase().split(/\s+/).filter(Boolean).reduce((acc, w) => acc + (ql.includes(w) ? 1 : 0), 0);
      if (score > best.score) best = { score, text: c.text, source: c.source };
    }
    return NextResponse.json({ answer: best.text, source: best.source });
  }

  // ensure embeddings exist for candidates
  const embedded = await ensureEmbeddings(candidates, OPENAI_KEY);

  // embed the query
  const qRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: [q] })
  });
  const qJson = await qRes.json();
  const qEmb = qJson.data[0].embedding;

  // compute similarities
  const scored = embedded.map((e: any) => ({ e, score: cosine(qEmb, e.embedding) }));
  scored.sort((a: any, b: any) => b.score - a.score);

  const top = scored.slice(0, 3).filter((s: any) => typeof s.score === 'number');
  const context = top.map((t: any, idx: number) => `Context ${idx + 1} (${t.e.source}): ${t.e.text}`).join('\n\n');

  // call Chat Completions to synthesize an answer with context
  const messages = [
    { role: 'system', content: 'You are a concise, professional assistant that answers questions about the candidate. Use the provided context when relevant.' },
    { role: 'user', content: `Question: ${q}\n\nContext:\n${context}\n\nProfile summary:\n${PROFILE.summary}` }
  ];

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, max_tokens: 400 })
  });
  const chatJson = await chatRes.json();
  const answer = chatJson?.choices?.[0]?.message?.content || top[0]?.e?.text || PROFILE.summary;
  const source = top.map((t: any) => t.e.source).join(', ');

  return NextResponse.json({ answer, source });
}
