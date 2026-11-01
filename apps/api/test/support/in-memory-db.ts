import { randomUUID } from 'node:crypto';
import type { AttendanceEvent, Student, Trip } from '@prisma/client';
import type { PrismaService } from '../../src/prisma/prisma.service';

type TripRow = Pick<Trip, 'id' | 'status'>;
type StudentRow = Pick<Student, 'id' | 'active'>;

/**
 * Minimal in-memory stand-in for the parts of PrismaService the attendance
 * module uses. Transactions run the callback directly against this store.
 */
export class InMemoryDb {
  readonly trips = new Map<string, TripRow>();
  readonly students = new Map<string, StudentRow>();
  readonly events: AttendanceEvent[] = [];

  addTrip(status: Trip['status'] = 'ACTIVE', id: string = randomUUID()): string {
    this.trips.set(id, { id, status });
    return id;
  }

  addStudent(active = true, id: string = randomUUID()): string {
    this.students.set(id, { id, active });
    return id;
  }

  readonly trip = {
    findUnique: async ({ where }: { where: { id: string } }) => this.trips.get(where.id) ?? null,
  };

  readonly student = {
    findUnique: async ({ where }: { where: { id: string } }) => this.students.get(where.id) ?? null,
  };

  readonly attendanceEvent = {
    findUnique: async ({ where }: { where: { idempotencyKey: string } }) =>
      this.events.find((event) => event.idempotencyKey === where.idempotencyKey) ?? null,
    findFirst: async ({ where }: { where: { tripId: string; studentId: string } }) => {
      const matches = this.events
        .filter((event) => event.tripId === where.tripId && event.studentId === where.studentId)
        .sort(
          (a, b) =>
            b.occurredAt.getTime() - a.occurredAt.getTime() || b.createdAt.getTime() - a.createdAt.getTime(),
        );
      return matches[0] ?? null;
    },
    create: async ({ data }: { data: Omit<AttendanceEvent, 'id' | 'createdAt' | 'manualReason' | 'confidence'> & {
      manualReason?: string | null;
      confidence?: number | null;
    } }) => {
      if (this.events.some((event) => event.idempotencyKey === data.idempotencyKey)) {
        throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
      }
      const event: AttendanceEvent = {
        id: randomUUID(),
        createdAt: new Date(),
        ...data,
        manualReason: data.manualReason ?? null,
        confidence: data.confidence ?? null,
      };
      this.events.push(event);
      return event;
    },
  };

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async $disconnect(): Promise<void> {}

  asPrisma(): PrismaService {
    return this as unknown as PrismaService;
  }
}
