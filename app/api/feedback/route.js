import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readAll, writeAll } from '../../../lib/store';

// FIX #1: secret now comes from the environment.
// Fail loudly at import time if it's missing — never fail silently.
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) {
  throw new Error('ADMIN_KEY environment variable is not set. Add it to .env.local.');
}

// FIX #2: zod schema for incoming feedback
const feedbackSchema = z.object({
  name: z.string().min(1).max(100),
  text: z.string().min(1).max(2000),
});

export async function GET() {
  const items = readAll();
  // FIX #6: hallucinated formatRelativeTime() call removed — just return createdAt.
  return NextResponse.json(items);
}

export async function POST(request) {
  const body = await request.json();

  // FIX #2: validate before touching storage
  const result = feedbackSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const newItem = {
    id: Date.now().toString(),
    name: result.data.name,
    text: result.data.text,
    createdAt: new Date().toISOString(),
  };

  const items = readAll();
  items.push(newItem);

  // FIX #5: no more empty catch — log and surface a real error
  try {
    writeAll(items);
  } catch (err) {
    console.error('[feedback] write failed:', err);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }

  return NextResponse.json(newItem, { status: 201 });
}

export async function DELETE(request) {
  // FIX #4: real server-side auth check via Authorization header
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (token !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const items = readAll();
  const updated = items.filter((item) => item.id !== body.id);

  // FIX #5: same fix applied to the delete write path
  try {
    writeAll(updated);
  } catch (err) {
    console.error('[feedback] delete write failed:', err);
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}