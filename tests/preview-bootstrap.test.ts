import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { test } from 'node:test';
import { api, bootstrapFailure } from '../src/lib/api.js';

test('request helper rejects platform errors, redirects, malformed JSON and network failures safely', async (t) => {
  const diagnostics: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => diagnostics.push(args));
  const cases = [
    () => new Response('NOT_FOUND private-body', { status: 404 }),
    () => new Response('<html>private-body Login</html>', { headers: { 'content-type': 'text/html' } }),
    () => new Response('{private-body', { headers: { 'content-type': 'application/json' } }),
    () => Response.json({ error: 'private-body server credentials' }, { status: 503 }),
    () => { throw new Error('private-body network details'); },
    () => { const response = Response.json({}); Object.defineProperty(response, 'redirected', { value: true }); return response; },
  ];
  for (const makeResponse of cases) {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => makeResponse());
    await assert.rejects(api('/api/public/bootstrap?private-query=true'), { message: 'Tidak dapat menghubungi server FALAH. Silakan coba lagi.' });
    fetchMock.mock.restore();
  }
  assert.equal(diagnostics.length, cases.length);
  assert.doesNotMatch(JSON.stringify(diagnostics), /private-body|private-query/);
  assert.equal(bootstrapFailure, 'Gagal memuat data FALAH. Silakan muat ulang halaman.');
});

test('request helper preserves successful JSON and expected validation messages', async (t) => {
  t.mock.method(console, 'error', () => {});
  const payload = { divisions: [], sessions: [] };
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json(payload));
  assert.deepEqual(await api('/api/public/bootstrap'), payload);
  fetchMock.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Divisi tidak valid' }, { status: 400 }));
  await assert.rejects(api('/api/public/members'), { message: 'Divisi tidak valid' });
});

test('explicit Vercel entrypoint serves Express routes without the local listener', async (t) => {
  // This check must never connect to the real Supabase project.
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  t.mock.method(console, 'error', () => {});
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.rewrites[0], { source: '/api/:path*', destination: '/api' });
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');
    const bootstrap = await fetch(`${base}/api/public/bootstrap`);
    assert.equal(bootstrap.status, 503); // Reached Express; safely reports missing local configuration.
    assert.deepEqual(await bootstrap.json(), { error: bootstrapFailure });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
