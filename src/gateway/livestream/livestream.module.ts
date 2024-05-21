import { Module } from '@nestjs/common';
import { LiveStreamRoomController } from './livestream.controller';
import { LivestreamRoomService } from './livestream.service';
import { ShareModule } from 'src/share/share.module';
import { WssModule } from '../wss/wss.module';

@Module({
  imports: [ShareModule, WssModule],
  controllers: [LiveStreamRoomController],
  providers: [LivestreamRoomService],
  exports: [LivestreamRoomService],
})
export class LiveStreamModule {}
