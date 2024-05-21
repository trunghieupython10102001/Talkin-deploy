import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './gateway/auth/guards/auth.guard';
import { GatewayModule } from './gateway/gateway.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [GatewayModule, CronModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
