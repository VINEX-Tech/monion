import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryDb } from '../../test/support/in-memory-db';
import { AttendanceService, RecordAttendance } from './attendance.service';

describe('AttendanceService', () => {
  let db: InMemoryDb;
  let service: AttendanceService;
  let tripId: string;
  let studentId: string;

  const event = (overrides: Partial<RecordAttendance> = {}): RecordAttendance => ({
    idempotencyKey: randomUUID(),
    tripId,
    studentId,
    direction: 'IN',
    occurredAt: new Date('2026-10-01T07:30:00.000Z'),
    source: 'UNIVERSITY_QR',
    confidence: 0.99,
    ...overrides,
  });

  beforeEach(() => {
    db = new InMemoryDb();
    service = new AttendanceService(db.asPrisma());
    tripId = db.addTrip();
    studentId = db.addStudent();
  });

  it('records a first IN event', async () => {
    const result = await service.record(event());
    expect(result.created).toBe(true);
    expect(result.event.direction).toBe('IN');
    expect(db.events).toHaveLength(1);
  });

  it('accepts IN then OUT', async () => {
    await service.record(event());
    const out = await service.record(event({ direction: 'OUT', occurredAt: new Date('2026-10-01T08:10:00.000Z') }));
    expect(out.created).toBe(true);
    expect(db.events.map((e) => e.direction)).toEqual(['IN', 'OUT']);
  });

  it('replays the same idempotency key without creating a second row', async () => {
    const input = event();
    const first = await service.record(input);
    const second = await service.record({ ...input });
    expect(second.created).toBe(false);
    expect(second.event.id).toBe(first.event.id);
    expect(db.events).toHaveLength(1);
  });

  it('rejects a reused idempotency key with a different payload', async () => {
    const input = event();
    await service.record(input);
    await expect(service.record({ ...input, direction: 'OUT' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects consecutive IN events with a conflict', async () => {
    await service.record(event());
    await expect(service.record(event())).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects OUT before any IN', async () => {
    await expect(service.record(event({ direction: 'OUT' }))).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a trip that is not active', async () => {
    const planned = db.addTrip('PLANNED');
    await expect(service.record(event({ tripId: planned }))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.record(event({ tripId: randomUUID() }))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an inactive or unknown student', async () => {
    const inactive = db.addStudent(false);
    await expect(service.record(event({ studentId: inactive }))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.record(event({ studentId: randomUUID() }))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires a non-blank reason for manual entries and trims it', async () => {
    await expect(service.record(event({ source: 'MANUAL', manualReason: '   ' }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const result = await service.record(event({ source: 'MANUAL', manualReason: '  card damaged  ' }));
    expect(result.event.manualReason).toBe('card damaged');
  });

  it('replays when a concurrent insert wins the unique key', async () => {
    const input = event();
    const create = db.attendanceEvent.create;
    // Another request inserts the same key between our lookup and our insert.
    db.attendanceEvent.create = async (args) => {
      await create(args);
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    };
    const result = await service.record(input);
    expect(result.created).toBe(false);
    expect(db.events).toHaveLength(1);
  });

  it('maps a serialization failure to a retryable conflict', async () => {
    db.$transaction = async () => {
      throw Object.assign(new Error('could not serialize access'), { code: 'P2034' });
    };
    await expect(service.record(event())).rejects.toBeInstanceOf(ConflictException);
  });
});
