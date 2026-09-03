import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['dist/main.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', (chunk) => { output += chunk; });
child.stderr.on('data', (chunk) => { output += chunk; });

try {
  const port = await waitForPort();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectJson(`${baseUrl}/health`, 200, { status: 'live' });
  await expectJson(`${baseUrl}/ready`, 200, { status: 'ready' });
  await expectJson(`${baseUrl}/api/users?email=ada%40example.com`, 200, [{
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
  }]);
  await expectJson(`${baseUrl}/api/users/search`, 200, [{
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
  }], {
    method: 'QUERY',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com' }),
  });

  const invalid = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'invalid', extra: true }),
  });
  assert.equal(invalid.status, 400);

  const preflight = await fetch(`${baseUrl}/api/users`, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:3000',
      'access-control-request-method': 'POST',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:3000');

  assert.equal((await fetch(`${baseUrl}/openapi.json`)).status, 200);
  assert.equal((await fetch(`${baseUrl}/docs`)).status, 200);
  console.log(`Example smoke test passed on port ${port}.`);
} finally {
  const exited = child.exitCode !== null
    ? Promise.resolve()
    : new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  const forceKill = setTimeout(() => {
    if (child.exitCode === null) child.kill('SIGKILL');
  }, 500);
  await exited;
  clearTimeout(forceKill);
}

async function waitForPort() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const match = output.match(/Server listening at http:\/\/127\.0\.0\.1:(\d+)/);
    if (match?.[1]) return Number.parseInt(match[1], 10);
    if (child.exitCode !== null) throw new Error(`Example exited early:\n${output}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for example:\n${output}`);
}

async function expectJson(url, status, expected, init) {
  const response = await fetch(url, init);
  assert.equal(response.status, status, `${init?.method ?? 'GET'} ${url}`);
  assert.deepEqual(await response.json(), expected);
  assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/);
}
