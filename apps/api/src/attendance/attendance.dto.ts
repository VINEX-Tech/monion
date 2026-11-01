import {
  IsIn,
  IsNumber,
  IsOptional,
  IsRFC3339,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import type { AttendanceEvent } from '@prisma/client';
import type { Direction } from './attendance-state';

export const ATTENDANCE_SOURCES = ['UNIVERSITY_QR', 'NATIONAL_ID_BARCODE', 'OCR', 'MANUAL'] as const;
export type AttendanceSource = (typeof ATTENDANCE_SOURCES)[number];

/**
 * Request body for POST /v1/attendance/events. Mirrors the
 * AttendanceEventInput schema in packages/contracts/openapi.yaml; the contract
 * test in test/contract.test.ts keeps the two aligned.
 */
export class CreateAttendanceEventDto {
  @IsUUID()
  tripId!: string;

  @IsUUID()
  studentId!: string;

  @IsIn(['IN', 'OUT'])
  direction!: Direction;

  @IsRFC3339()
  occurredAt!: string;

  @IsIn(ATTENDANCE_SOURCES)
  source!: AttendanceSource;

  // Required for MANUAL entries (business rule), optional otherwise.
  @ValidateIf((body: CreateAttendanceEventDto) => body.source === 'MANUAL' || body.manualReason !== undefined)
  @IsString()
  @Length(3, 500)
  manualReason?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1)
  confidence?: number;
}

export interface AttendanceEventResponse {
  id: string;
  idempotencyKey: string;
  tripId: string;
  studentId: string;
  direction: Direction;
  occurredAt: string;
  source: AttendanceSource;
  manualReason?: string;
  confidence?: number;
  createdAt: string;
}

export function toAttendanceEventResponse(event: AttendanceEvent): AttendanceEventResponse {
  return {
    id: event.id,
    idempotencyKey: event.idempotencyKey,
    tripId: event.tripId,
    studentId: event.studentId,
    direction: event.direction as Direction,
    occurredAt: event.occurredAt.toISOString(),
    source: event.source as AttendanceSource,
    ...(event.manualReason != null ? { manualReason: event.manualReason } : {}),
    ...(event.confidence != null ? { confidence: event.confidence } : {}),
    createdAt: event.createdAt.toISOString(),
  };
}
