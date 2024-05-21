import { Module } from '@nestjs/common';
import { ShareModule } from 'src/share/share.module';
import { CronService } from './cron.service';
import { LiveStreamModule } from 'src/gateway/livestream/livestream.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), ShareModule, LiveStreamModule],
  controllers: [],
  providers: [CronService],
  exports: [],
})
export class CronModule {}
