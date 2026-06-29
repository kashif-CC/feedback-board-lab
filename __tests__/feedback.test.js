import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

process.env.ADMIN_KEY = 'test-admin-key';

const DATA_FILE = path.join(process.cwd(), 'data', 'feedback.json');

beforeEach(() => {
  // start each test with a clean, empty feedback file
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
});

afterEach(() => {
  if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
});

describe('POST /api/feedback', () => {
  it('returns 400 for invalid input (missing text)', async () => {
    const { POST } = await import('../app/api/feedback/route.js');
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }), // no text
    });
    const res = await POST(request);
    expect(res.status).toBe(400);
  });

  it('returns 201 for a valid submission', async () => {
    const { POST } = await import('../app/api/feedback/route.js');
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice', text: 'Great app!' }),
    });
    const res = await POST(request);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Alice');
    expect(body.text).toBe('Great app!');
  });
});

describe('DELETE /api/feedback', () => {
  it('returns 403 when Authorization header is missing or wrong', async () => {
    const { DELETE } = await import('../app/api/feedback/route.js');
    const request = new Request('http://localhost/api/feedback', {
      method: 'DELETE',
      body: JSON.stringify({ id: '123' }),
    });
    const res = await DELETE(request);
    expect(res.status).toBe(403);
  });

  it('succeeds with the correct Authorization header', async () => {
    const { DELETE } = await import('../app/api/feedback/route.js');
    const request = new Request('http://localhost/api/feedback', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-admin-key' },
      body: JSON.stringify({ id: '123' }),
    });
    const res = await DELETE(request);
    expect(res.status).toBe(200);
  });
});