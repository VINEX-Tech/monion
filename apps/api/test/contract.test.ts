import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CreateAttendanceEventDto } from '../src/attendance/attendance.dto';
import { contract, contractSchema } from './support/contract';

const pipe = new ValidationPipe({
  expectedType: CreateAttendanceEventDto,
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

async function dtoAccepts(value: object): Promise<boolean> {
  try {
    await pipe.transform(value, { type: 'body' });
    return true;
  } catch {
    return false;
  }
}

const valid = {
  tripId: randomUUID(),
  studentId: randomUUID(),
  direction: 'OUT',
  occurredAt: '2026-10-01T07:30:00.000+02:00',
  source: 'NATIONAL_ID_BARCODE',
};

describe('OpenAPI contract', () => {
  it('declares only the implemented paths', () => {
    expect(Object.keys(contract.paths).sort()).toEqual(['/attendance/events', '/health']);
    expect(Object.keys(contract.paths['/attendance/events'])).toEqual(['post']);
    expect(Object.keys(contract.paths['/health'])).toEqual(['get']);
  });

  const cases: Array<[string, object]> = [
    ['minimal valid body', valid],
    ['with confidence', { ...valid, confidence: 0 }],
    ['with reason', { ...valid, source: 'MANUAL', manualReason: 'card left at home' }],
    ['missing studentId', { ...valid, studentId: undefined }],
    ['extra property', { ...valid, seat: 4 }],
    ['bad enum', { ...valid, direction: 'in' }],
    ['negative confidence', { ...valid, confidence: -0.1 }],
    ['date only', { ...valid, occurredAt: '2026-10-01' }],
    ['non-UUID trip', { ...valid, tripId: '42' }],
    ['reason too long', { ...valid, manualReason: 'x'.repeat(501) }],
  ];

  it.each(cases)('DTO validation and contract agree: %s', async (_label, raw) => {
    const value = JSON.parse(JSON.stringify(raw)) as object;
    const schema = contractSchema('AttendanceEventInput');
    expect(await dtoAccepts(value)).toBe(schema(value));
  });

  it('enforces the documented MANUAL reason rule beyond the schema', async () => {
    const value = { ...valid, source: 'MANUAL' };
    expect(contractSchema('AttendanceEventInput')(value)).toBe(true);
    expect(await dtoAccepts(value)).toBe(false);
  });
});
