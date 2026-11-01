import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { contractSchema } from './support/contract';
import { InMemoryDb } from './support/in-memory-db';

describe('HTTP: /v1 (in-memory database)', () => {
  let app: INestApplication;
  const db = new InMemoryDb();
  const attendanceEvent = contractSchema('AttendanceEvent');
  const errorBody = contractSchema('Error');
  const health = contractSchema('Health');
  let tripId: string;
  let studentId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db.asPrisma())
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    tripId = db.addTrip();
    studentId = db.addStudent();
  });

  const body = (overrides: Record<string, unknown> = {}) => ({
    tripId,
    studentId,
    direction: 'IN',
    occurredAt: '2026-10-01T07:30:00Z',
    source: 'UNIVERSITY_QR',
    confidence: 0.98,
    ...overrides,
  });

  const post = (key: string | undefined, payload: object) => {
    const req = request(app.getHttpServer()).post('/v1/attendance/events');
    if (key !== undefined) req.set('Idempotency-Key', key);
    return req.send(payload);
  };

  it('GET /v1/health matches the contract', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(health(res.body)).toBe(true);
  });

  it('creates an event with 201 and a contract-shaped body', async () => {
    const key = randomUUID();
    const res = await post(key, body()).expect(201);
    expect(attendanceEvent(res.body), JSON.stringify(attendanceEvent.errors)).toBe(true);
    expect(res.body).toMatchObject({ idempotencyKey: key, tripId, studentId, direction: 'IN' });
  });

  it('replays the same Idempotency-Key with 200 and the original event', async () => {
    const key = randomUUID();
    const first = await post(key, body()).expect(201);
    const second = await post(key, body()).expect(200);
    expect(second.body.id).toBe(first.body.id);
    expect(attendanceEvent(second.body)).toBe(true);
  });

  it('returns 409 when the key is reused with a different body', async () => {
    const key = randomUUID();
    await post(key, body()).expect(201);
    const res = await post(key, body({ direction: 'OUT' })).expect(409);
    expect(errorBody(res.body)).toBe(true);
  });

  it('returns 409 for a duplicate consecutive IN and for OUT before IN', async () => {
    await post(randomUUID(), body()).expect(201);
    await post(randomUUID(), body({ occurredAt: '2026-10-01T07:31:00Z' })).expect(409);
    const otherStudent = db.addStudent();
    await post(randomUUID(), body({ studentId: otherStudent, direction: 'OUT' })).expect(409);
  });

  it('accepts IN then OUT', async () => {
    await post(randomUUID(), body()).expect(201);
    await post(randomUUID(), body({ direction: 'OUT', occurredAt: '2026-10-01T08:05:00Z' })).expect(201);
  });

  it('returns 404 for an inactive trip or unknown student', async () => {
    await post(randomUUID(), body({ tripId: db.addTrip('COMPLETED') })).expect(404);
    const res = await post(randomUUID(), body({ studentId: randomUUID() })).expect(404);
    expect(errorBody(res.body)).toBe(true);
  });

  it.each([
    ['missing', undefined],
    ['not a UUID', 'retry-1'],
  ])('returns 400 when Idempotency-Key is %s', async (_label, key) => {
    const res = await post(key, body()).expect(400);
    expect(errorBody(res.body)).toBe(true);
  });

  it.each([
    ['unknown property', { extra: true }],
    ['bad direction', { direction: 'SIDEWAYS' }],
    ['date without time', { occurredAt: '2026-10-01' }],
    ['non-UUID trip', { tripId: 'trip-1' }],
    ['confidence above 1', { confidence: 1.5 }],
    ['unknown source', { source: 'FACE' }],
    ['MANUAL without reason', { source: 'MANUAL' }],
    ['reason too short', { source: 'MANUAL', manualReason: 'no' }],
  ])('returns 400 for %s', async (_label, overrides) => {
    const res = await post(randomUUID(), body(overrides)).expect(400);
    expect(errorBody(res.body)).toBe(true);
  });

  it('accepts a MANUAL entry with a reason', async () => {
    const res = await post(randomUUID(), body({ source: 'MANUAL', manualReason: 'QR card damaged', confidence: undefined }))
      .expect(201);
    expect(res.body.manualReason).toBe('QR card damaged');
    expect(res.body).not.toHaveProperty('confidence');
  });
});
