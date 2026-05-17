/**
 * Type of your profile object
 */
export interface ProfileType {
  summary: string;
  skills: string[];
  projects: { title: string; summary: string }[];
}

/**
 * Global model + embeddings cache (loaded once)
 */
let model: any = null;
let docEmbeddings: number[][] = [];
let DOCUMENTS: { text: string; source: string }[] = [];
const CUSTOM_DOCS_KEY = "profile_custom_docs_v1";

function loadCustomDocsFromStorage() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(CUSTOM_DOCS_KEY) : null;
    if (!raw) return [];
    return JSON.parse(raw) as { text: string; source: string }[];
  } catch (e) {
    return [];
  }
}

function saveCustomDocsToStorage(docs: { text: string; source: string }[]) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(CUSTOM_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {}
}

/**
 * Load TensorFlow model & embed portfolio on first run (lazy-imports heavy libs)
 */
export async function initAIAssistant(PROFILE: ProfileType) {
  if (model) return; // already loaded

  // Lazy-load heavy TF libraries in the browser at runtime
  const use = await import("@tensorflow-models/universal-sentence-encoder");
  await import("@tensorflow/tfjs");

  model = await use.load();

  // Build semantic chunks from your profile
  DOCUMENTS = [
    { text: PROFILE.summary, source: "Summary" },
    ...PROFILE.skills.map((s) => ({ text: s, source: "Skills" })),
    ...PROFILE.projects.map((p) => ({
      text: p.summary,
      source: `Project • ${p.title}`,
    })),
    // include any custom user-added docs stored in localStorage
    ...loadCustomDocsFromStorage(),
  ];

  // Embed all portfolio chunks
  const texts = DOCUMENTS.map((d) => d.text);
  const embTensor = await model.embed(texts);
  docEmbeddings = await embTensor.array();
}

/**
 * Allow adding custom short docs (user feedback) to the assistant knowledge.
 * Saves to localStorage and updates DOCUMENTS array. If model is loaded, also
 * computes and appends the embedding so it's available immediately.
 */
export async function addCustomDoc(doc: { text: string; source: string }) {
  try {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('ADMIN_TOKEN') : null;
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/docs', { method: 'POST', headers, body: JSON.stringify(doc) });
    const data = await res.json();
    // also save locally for offline
    const existing = loadCustomDocsFromStorage();
    existing.push({ text: doc.text, source: doc.source });
    saveCustomDocsToStorage(existing);
    return data;
  } catch (e) {
    // fallback to local save
    const existing = loadCustomDocsFromStorage();
    existing.push(doc);
    saveCustomDocsToStorage(existing);
    return doc;
  }
}

/**
 * Cosine similarity
 */
function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * MAIN FUNCTION
 */
export async function answerQuery(
  q: string,
  setAnswer: (t: string) => void,
  setSource: (t: string) => void,
  PROFILE: ProfileType
) {
  // Use server-side assistant API for reliable, lightweight responses
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    });
    const data = await res.json();
    if (data && data.answer) {
      setAnswer(data.answer);
      setSource(data.source || 'Server');
      return;
    }
  } catch (e) {
    // fall through to client heuristics
  }

  // Simple client-side fallback heuristics
  const qn = q.trim().toLowerCase();
  if (!qn) {
    setAnswer('Ask me anything about my skills, experience, or projects.');
    setSource('');
    return;
  }

  if (qn.includes('react') && !qn.includes('native')) {
    setAnswer(
      PROFILE.summary + ' I work heavily with React, TypeScript, clean components, and UI architecture.'
    );
    setSource('Summary • Skills');
    return;
  }

  setAnswer(PROFILE.summary);
  setSource('Summary');
}
