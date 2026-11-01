import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createRosterServer, students } from './roster.mjs';

let server;
let base;

before(async () => {
  server = createRosterServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('returns the whole roster in one page by default', async () => {
  const body = await (await fetch(`${base}/v1/roster`)).json();
  assert.equal(body.students.length, students.length);
  assert.equal(body.complete, true);
  assert.equal(body.nextPageToken, null);
});

test('pages with pageToken and limit', async () => {
  const first = await (await fetch(`${base}/v1/roster?limit=2`)).json();
  assert.deepEqual(first.students.map((s) => s.universityId), ['U-0001', 'U-0002']);
  assert.equal(first.complete, false);
  const second = await (await fetch(`${base}/v1/roster?pageToken=${first.nextPageToken}&limit=2`)).json();
  assert.deepEqual(second.students.map((s) => s.universityId), ['U-0003']);
  assert.equal(second.complete, true);
});

test('rejects invalid paging and unknown paths', async () => {
  assert.equal((await fetch(`${base}/v1/roster?limit=0`)).status, 400);
  assert.equal((await fetch(`${base}/v1/roster?pageToken=-1`)).status, 400);
  assert.equal((await fetch(`${base}/other`)).status, 404);
});
