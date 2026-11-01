import { createServer } from 'node:http';

// Synthetic roster used by local development and tests. Not real people.
export const students = [
  { universityId: 'U-0001', displayName: 'Qualification Student 1', active: true, updatedAt: '2026-01-01T00:00:00Z' },
  { universityId: 'U-0002', displayName: 'Qualification Student 2', active: true, updatedAt: '2026-01-02T00:00:00Z' },
  { universityId: 'U-0003', displayName: 'Qualification Student 3', active: false, updatedAt: '2026-01-03T00:00:00Z' },
];

/**
 * GET /v1/roster?pageToken=<offset>&limit=<n>
 * Responds with { students, nextPageToken, complete }.
 */
export function createRosterServer(roster = students) {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (request.method !== 'GET' || url.pathname !== '/v1/roster') {
      response.writeHead(404).end();
      return;
    }
    const offset = Number.parseInt(url.searchParams.get('pageToken') ?? '0', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '100', 10);
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 500) {
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'pageToken must be >= 0 and limit between 1 and 500' }));
      return;
    }
    const page = roster.slice(offset, offset + limit);
    const next = offset + page.length;
    const complete = next >= roster.length;
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ students: page, nextPageToken: complete ? null : String(next), complete }));
  });
}
