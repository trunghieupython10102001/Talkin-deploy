import { Module } from '@nestjs/common';
import { RoomModule } from './room/room.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WssModule } from './wss/wss.module';
import { LiveStreamModule } from './livestream/livestream.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    RoomModule,
    WssModule,
    LiveStreamModule,
    CategoryModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class GatewayModule {}
