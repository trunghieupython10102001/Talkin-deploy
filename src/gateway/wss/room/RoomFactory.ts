import { RoomParams } from '../wss.interfaces';
import LivestreamRoom from './LivestreamRoom';
import MeetingRoom from './MeetingRoom';

class RoomFactory {
  createMeetingRoom(params: RoomParams) {
    return new MeetingRoom(
      params.worker,
      params.workerIndex,
      params.id,
      params.wssServer,
      params.prismaService,
      params.mailService,
    );
  }

  createLivestreamRoom(params: RoomParams) {
    return new LivestreamRoom(
      params.worker,
      params.workerIndex,
      params.id,
      params.wssServer,
      params.prismaService,
      params.mailService,
    );
  }
}

export default RoomFactory;
