import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LivestreamRoomService } from 'src/gateway/livestream/livestream.service';
import { LivestreamRoomStatus } from 'src/common/constants/livestream-room.enum';

@Injectable()
export class CronService {
  constructor(private readonly livestreamRoomService: LivestreamRoomService) {}

  @Interval(5 * 60 * 1000)
  async runUpdateComingSoonLiveStream() {
    try {
      console.log('[CRON] update comingSoon LiveStreams start');
      const currentTimeMinus1h = new Date(
        new Date().getTime() - 60 * 60 * 1000,
      );
      const query = {
        status: LivestreamRoomStatus.COMING_SOON,
        startTime: { lte: currentTimeMinus1h },
      };

      const comingSoonRooms = await this.livestreamRoomService.getAllByQuery(
        query,
      );
      if (comingSoonRooms?.length) {
        const updateIds = comingSoonRooms.map((room) => room.id);
        const updateQuery = {
          id: {
            in: updateIds,
          },
        };
        await this.livestreamRoomService.updateByQuery(updateQuery, {
          status: LivestreamRoomStatus.CANCELLED,
        });
        console.log(
          `[CRON] updated ${updateIds.length} comingSoon LiveStreams to Canceled`,
        );
      } else {
        console.log('[CRON] no comingSoon LiveStreams updated');
      }
    } catch (error) {
      console.log('[CRON] update comingSoon LiveStreams ERROR: ', error);
    }
  }
}
