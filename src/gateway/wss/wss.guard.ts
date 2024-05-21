import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IPeerInfo, IClientQuery } from './wss.interfaces';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { LivestreamRoomStatus } from 'src/common/constants/livestream-room.enum';
import { MeetingRoomStatus } from 'src/common/constants/meeting-room.enum';

@Injectable()
export class WssGuard {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async verifyClientQuery(clientQuery: IClientQuery): Promise<IPeerInfo> {
    const { accessToken, roomId, isLivestreamRoom, device } = clientQuery;
    let creatorId: number;
    if (isLivestreamRoom === 'true') {
      const liveStreamRoom = await this.prismaService.livestreamRoom.findFirst({
        where: { id: roomId },
      });

      if (
        !liveStreamRoom ||
        liveStreamRoom.status == LivestreamRoomStatus.CANCELLED ||
        liveStreamRoom.status == LivestreamRoomStatus.END
      )
        throw new NotFoundException();
      creatorId = liveStreamRoom.creatorId;
    } else {
      const room = await this.prismaService.room.findFirst({
        where: { id: roomId },
      });

      if (!room || room.status == MeetingRoomStatus.CLOSED)
        throw new NotFoundException();
      creatorId = room.creatorId;
    }

    // when user is a guest
    if (!accessToken)
      return {
        roomId,
        isLivestreamRoom: isLivestreamRoom === 'true',
        device,
        isGuest: true,
      } as IPeerInfo;

    //TODO: check room private or public here
    try {
      const userDecode = await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.prismaService.user.findFirst({
        where: { id: userDecode?.id },
      });
      if (!user) throw new UnauthorizedException();

      return {
        userId: user.id.toString(),
        displayName: user.firstname + ' ' + user.lastname,
        avatarUrl: user.avatar,
        description: user.id === creatorId ? user.description : undefined,
        roomId,
        isLivestreamRoom: isLivestreamRoom === 'true',
        device,
        isHost: user.id === creatorId,
      } as IPeerInfo;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
