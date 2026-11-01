import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { contractSchema } from './support/contract';

// Runs against a real, migrated PostgreSQL database (DATABASE_URL).
describe('HTTP: /v1/attendance/events (PostgreSQL)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let tripId: string;
  let studentId: string;
  const attendanceEvent = contractSchema('AttendanceEvent');

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the PostgreSQL suite');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    db = app.get(PrismaService);

    // Synthetic fixtures only.
    const suffix = randomUUID().slice(0, 8);
    const user = await db.user.create({
      data: { username: `driver-${suffix}`, email: `driver-${suffix}@example.test`, passwordHash: 'not-a-real-hash', role: 'DRIVER' },
    });
    const driver = await db.driver.create({ data: { userId: user.id } });
    const device = await db.device.create({
      data: {
        installationId: randomUUID(), userId: user.id, manufacturer: 'Test', model: 'Fixture',
        androidVersion: '14', appVersion: '0.1.0', cpuAbi: 'arm64-v8a', capabilityReport: {},
      },
    });
    const bus = await db.bus.create({ data: { fleetNumber: `F-${suffix}`, plateNumber: `P-${suffix}` } });
    const route = await db.route.create({ data: { name: `Route ${suffix}`, expectedDurationMinutes: 40 } });
    const trip = await db.trip.create({
      data: { clientId: randomUUID(), routeId: route.id, busId: bus.id, driverId: driver.id, deviceId: device.id, status: 'ACTIVE' },
    });
    const student = await db.student.create({ data: { universityId: `U-${suffix}`, displayName: 'Fixture Student' } });
    tripId = trip.id;
    studentId = student.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  const post = (key: string, overrides: Record<string, unknown> = {}) =>
    request(app.getHttpServer())
      .post('/v1/attendance/events')
      .set('Idempotency-Key', key)
      .send({ tripId, studentId, direction: 'IN', occurredAt: '2026-10-01T07:30:00Z', source: 'UNIVERSITY_QR', ...overrides });

  it('stores IN, replays it, rejects a duplicate IN, then stores OUT', async () => {
    const key = randomUUID();
    const created = await post(key).expect(201);
    expect(attendanceEvent(created.body)).toBe(true);

    const replay = await post(key).expect(200);
    expect(replay.body.id).toBe(created.body.id);

    await post(randomUUID(), { occurredAt: '2026-10-01T07:31:00Z' }).expect(409);
    await post(randomUUID(), { direction: 'OUT', occurredAt: '2026-10-01T08:00:00Z' }).expect(201);

    const rows = await db.attendanceEvent.findMany({ where: { tripId, studentId }, orderBy: { occurredAt: 'asc' } });
    expect(rows.map((row) => row.direction)).toEqual(['IN', 'OUT']);
  });

  it('keeps one row when the same key is sent concurrently', async () => {
    const key = randomUUID();
    const results = await Promise.all([1, 2, 3].map(() => post(key, { occurredAt: '2026-10-01T09:00:00Z' })));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.every((s) => s === 200 || s === 201 || s === 409)).toBe(true);
    expect(await db.attendanceEvent.count({ where: { idempotencyKey: key } })).toBe(1);
  });
});
