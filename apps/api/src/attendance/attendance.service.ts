import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceDirection, Prisma } from '@prisma/client';
import type { AttendanceEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertAttendanceTransition, AttendanceTransitionError, Direction } from './attendance-state';
import type { AttendanceSource } from './attendance.dto';

export interface RecordAttendance {
  idempotencyKey: string;
  tripId: string;
  studentId: string;
  direction: Direction;
  occurredAt: Date;
  source: AttendanceSource;
  manualReason?: string;
  confidence?: number;
}

export interface RecordResult {
  event: AttendanceEvent;
  /** False when the idempotency key was already used for the same payload. */
  created: boolean;
}

@Injectable()
export class AttendanceService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async record(input: RecordAttendance): Promise<RecordResult> {
    const manualReason = input.manualReason?.trim() || undefined;
    if (input.source === 'MANUAL' && !manualReason) {
      throw new BadRequestException('Manual attendance requires an audited reason');
    }
    const normalized: RecordAttendance = { ...input, manualReason };

    try {
      return await this.db.$transaction(
        async (tx) => {
          const existing = await tx.attendanceEvent.findUnique({
            where: { idempotencyKey: normalized.idempotencyKey },
          });
          if (existing) return { event: assertSamePayload(existing, normalized), created: false };

          const [trip, student, previous] = await Promise.all([
            tx.trip.findUnique({ where: { id: normalized.tripId } }),
            tx.student.findUnique({ where: { id: normalized.studentId } }),
            tx.attendanceEvent.findFirst({
              where: { tripId: normalized.tripId, studentId: normalized.studentId },
              orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
            }),
          ]);
          if (!trip || trip.status !== 'ACTIVE') throw new NotFoundException('Active trip not found');
          if (!student?.active) throw new NotFoundException('Active roster student not found');

          try {
            assertAttendanceTransition((previous?.direction as Direction | undefined) ?? null, normalized.direction);
          } catch (error) {
            if (error instanceof AttendanceTransitionError) throw new ConflictException(error.message);
            throw error;
          }

          const event = await tx.attendanceEvent.create({
            data: {
              idempotencyKey: normalized.idempotencyKey,
              tripId: normalized.tripId,
              studentId: normalized.studentId,
              direction: normalized.direction as AttendanceDirection,
              occurredAt: normalized.occurredAt,
              source: normalized.source,
              manualReason: normalized.manualReason,
              confidence: normalized.confidence,
            },
          });
          return { event, created: true };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        // A concurrent request with the same key won the insert: replay it.
        const existing = await this.db.attendanceEvent.findUnique({
          where: { idempotencyKey: normalized.idempotencyKey },
        });
        if (existing) return { event: assertSamePayload(existing, normalized), created: false };
      }
      if (isPrismaError(error, 'P2034')) {
        throw new ConflictException('Concurrent attendance update for this passenger; retry the request');
      }
      throw error;
    }
  }
}

function assertSamePayload(existing: AttendanceEvent, input: RecordAttendance): AttendanceEvent {
  const same =
    existing.tripId === input.tripId &&
    existing.studentId === input.studentId &&
    existing.direction === input.direction &&
    existing.occurredAt.getTime() === input.occurredAt.getTime() &&
    existing.source === input.source &&
    (existing.manualReason ?? undefined) === input.manualReason &&
    (existing.confidence ?? undefined) === input.confidence;
  if (!same) {
    throw new ConflictException('Idempotency-Key was already used with a different payload');
  }
  return existing;
}

function isPrismaError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === code;
}
