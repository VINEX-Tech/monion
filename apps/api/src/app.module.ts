import { Module } from '@nestjs/common';
import { AttendanceModule } from './attendance/attendance.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [HealthController],
})
export class AppModule {}
