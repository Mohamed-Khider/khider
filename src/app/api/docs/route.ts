import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'custom_docs.json');

async function readDocs() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function writeDocs(docs: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(docs, null, 2), 'utf-8');
}

export async function GET() {
  return NextResponse.json(await readDocs());
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const docs = await readDocs();
  const id = Date.now().toString();
  const doc = { id, ...body };
  docs.push(doc);
  await writeDocs(docs);
  return NextResponse.json(doc);
}

export async function PUT(request: Request) {
  const auth = request.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const docs = await readDocs();
  const idx = docs.findIndex((d: any) => d.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  docs[idx] = { ...docs[idx], ...body };
  await writeDocs(docs);
  return NextResponse.json(docs[idx]);
}

export async function DELETE(request: Request) {
  const auth = request.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  let docs = await readDocs();
  docs = docs.filter((d: any) => d.id !== id);
  await writeDocs(docs);
  return NextResponse.json({ ok: true });
}
