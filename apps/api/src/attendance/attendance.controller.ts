import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpStatus,
  Inject,
  Post,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { isUUID } from 'class-validator';
import { AttendanceService } from './attendance.service';
import {
  AttendanceEventResponse,
  CreateAttendanceEventDto,
  toAttendanceEventResponse,
} from './attendance.dto';

// expectedType is set explicitly so validation does not depend on emitted
// decorator metadata (the test runner compiles without it).
const bodyPipe = new ValidationPipe({
  expectedType: CreateAttendanceEventDto,
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller('attendance/events')
export class AttendanceController {
  constructor(@Inject(AttendanceService) private readonly attendance: AttendanceService) {}

  /** 201 for a new event, 200 when the Idempotency-Key replays an earlier one. */
  @Post()
  async create(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(bodyPipe) body: CreateAttendanceEventDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AttendanceEventResponse> {
    if (!idempotencyKey || !isUUID(idempotencyKey)) {
      throw new BadRequestException('Idempotency-Key header must be a UUID');
    }
    const { event, created } = await this.attendance.record({
      idempotencyKey: idempotencyKey.toLowerCase(),
      tripId: body.tripId,
      studentId: body.studentId,
      direction: body.direction,
      occurredAt: new Date(body.occurredAt),
      source: body.source,
      manualReason: body.manualReason,
      confidence: body.confidence,
    });
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return toAttendanceEventResponse(event);
  }
}
