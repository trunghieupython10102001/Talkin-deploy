import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { BaseService } from 'src/common/base/base.service';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from 'src/common/constants/errorcode.enum';
import { LivestreamRoomStatus } from 'src/common/constants/livestream-room.enum';
import { Request } from 'express';
import { CreateLiveStreamRoomDto } from './dtos/createLivestreamRoom.dto';
import { WssGateway } from '../wss/wss.gateway';
import { exclude } from 'src/common/lib';
import { AuthGuardRequest } from '../auth/guards/auth.guard';
import {
  getFormattedDate,
  getFormattedHourAndMinute,
} from 'src/common/utils/utils';
import { LivestreamScheduleEmailContext } from 'src/share/mailer/mail-context.interface';
import { ScheduleEmailType } from 'src/common/constants/schedule-email-type.enum';
import { MailService } from 'src/share/mailer/mail.service';
import { UpdateLivestreamRoomDTO } from './dtos/updateLivestreamRoom.dto';
import { CancelLivestreamRoomDto } from './dtos/cancelLivestreamRoom.dto';

@Injectable()
export class LivestreamRoomService extends BaseService {
  @Inject()
  protected wssGateway: WssGateway;

  constructor(
    prisma: PrismaService,
    configService: ConfigService,
    private mailService: MailService,
  ) {
    super(prisma, 'livestreamRoom', 'LivestreamRoom', configService);
  }

  async getLiveStreamRoomById(request: Request, id: string) {
    const livestreamRoom = await this.get(request, id);
    if (!livestreamRoom) {
      throw new NotFoundException({
        message: ErrorCode.ROOM_NOT_EXISTED,
      });
    }

    if (
      livestreamRoom?.status == LivestreamRoomStatus.END ||
      livestreamRoom?.status == LivestreamRoomStatus.CANCELLED
    ) {
      throw new NotFoundException({
        message: ErrorCode.LIVESTREAM_ROOM_ENDED,
      });
    }
    exclude(livestreamRoom.creator, ['password', 'createdAt', 'updatedAt']);
    return {
      ...livestreamRoom,
      peersCount: this.wssGateway.getRoomSize(id),
    };
  }

  async createLiveStreamRoom(
    creatorId: number,
    createLiveStreamRoomDto: CreateLiveStreamRoomDto,
    thumbnail?: string,
  ) {
    const { listCategory, startTime, invitedEmails, hasSendMail } =
      createLiveStreamRoomDto;

    //TODO send mail invited
    const newLiveStreamDto = {
      ...createLiveStreamRoomDto,
      creatorId,
      thumbnail,
      listCategory: listCategory
        ? listCategory.toString().split(',')
        : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
    };

    exclude(newLiveStreamDto, ['hasSendMail']);

    const newLiveStream = await this.create({ creatorId, ...newLiveStreamDto });

    // send mail
    if (invitedEmails && hasSendMail) {
      if (startTime) {
        this.sendMailScheduleLivestream({
          type: ScheduleEmailType.CREATE,
          newInvitedEmails: newLiveStream.invitedEmails,
          oldInvitedMemberEmails: [],
          livestreamName: newLiveStream.name,
          description: newLiveStream.description,
          startTime: newLiveStream.startTime,
          livestreamId: newLiveStream.id,
          category: newLiveStream.listCategory,
        });
      } else {
        void this.mailService.sendEmailInvitationLivestreamInstant({
          category: listCategory,
          livestreamName: newLiveStream.name,
          to: newLiveStreamDto.invitedEmails.join(','),
          livestreamLink: this.getLivestreamLink(newLiveStream.id),
          description: newLiveStreamDto.description,
        });
      }
    }

    return newLiveStream;
  }

  async getAllLivestream(req: Request) {
    req.query.status_notin = `${LivestreamRoomStatus.CANCELLED},${LivestreamRoomStatus.END}`;
    const livestreamRooms = await this.getAll(req);
    const newData = livestreamRooms.data.map((room) => {
      exclude(room.creator, ['password', 'createdAt', 'updatedAt']);
      return {
        ...room,
        peersCount: this.wssGateway.getRoomSize(room.id),
      };
    });
    return {
      meta: livestreamRooms.meta,
      data: newData,
    };
  }

  async sendMailScheduleLivestream({
    type,
    newInvitedEmails,
    oldInvitedMemberEmails,
    livestreamName,
    description,
    startTime,
    livestreamId,
    category,
  }: {
    type: ScheduleEmailType;
    newInvitedEmails: string[];
    oldInvitedMemberEmails: string[];
    livestreamName: string;
    description?: string;
    startTime: Date;
    livestreamId: string;
    category: string[];
  }) {
    const date = getFormattedDate(startTime);
    const startTimeString = getFormattedHourAndMinute(startTime);
    const emailContext: LivestreamScheduleEmailContext = {
      livestreamName,
      date,
      startTime: startTimeString,
      description,
      livestreamLink: this.getLivestreamLink(livestreamId),
      to: '',
      category,
    };
    if (type === ScheduleEmailType.CREATE) {
      if (newInvitedEmails.length) {
        emailContext.to = newInvitedEmails.join(',');
        await this.mailService.sendEmailInvitationLivestreamSchedule(
          emailContext,
        );
      }
    } else if (
      type === ScheduleEmailType.UPDATE_GUEST ||
      type === ScheduleEmailType.UPDATE_CONTENT
    ) {
      // send invite email to new guest added
      const newEmails = newInvitedEmails.filter(
        (x) => !oldInvitedMemberEmails.includes(x),
      );
      if (newEmails.length) {
        emailContext.to = newEmails.join(',');
        await this.mailService.sendEmailInvitationLivestreamSchedule(
          emailContext,
        );
      }

      // send remove email to old guest removed
      const removeEmails = oldInvitedMemberEmails.filter(
        (x) => !newInvitedEmails.includes(x),
      );
      if (removeEmails.length) {
        emailContext.to = removeEmails.join(',');
        await this.mailService.sendEmailCancelLivestreamSchedule(emailContext);
      }

      // send update email to old guest when schedule content update
      if (type === ScheduleEmailType.UPDATE_CONTENT) {
        const updateEmails = oldInvitedMemberEmails.filter((x) =>
          newInvitedEmails.includes(x),
        );
        if (updateEmails.length) {
          emailContext.to = updateEmails.join(',');
          await this.mailService.sendEmailUpdateLivestreamSchedule(
            emailContext,
          );
        }
      }
    } else if (type === ScheduleEmailType.CANCEL) {
      if (oldInvitedMemberEmails?.length) {
        emailContext.to = oldInvitedMemberEmails.join(',');
        await this.mailService.sendEmailCancelLivestreamSchedule(emailContext);
      }
    }
  }

  getLivestreamLink(livestreamId: string) {
    return process.env.DOMAIN + 'livestream/viewer/' + livestreamId;
  }

  hasArrayChanged(preArr: any[], currentArr: any[]): boolean {
    if (preArr.length !== currentArr.length) return true;
    if (preArr.length === 0) return false;
    return !preArr.every((item) => currentArr.includes(item));
  }

  hasContentChanged(preLiveStream, currentLiveStream) {
    const { name, description, startTime, listCategory } = currentLiveStream;

    const hasCategoryChanged = this.hasArrayChanged(
      preLiveStream.listCategory,
      listCategory,
    );
    return (
      preLiveStream.name !== name ||
      preLiveStream.description !== description ||
      preLiveStream.startTime !== startTime ||
      hasCategoryChanged
    );
  }

  async updateScheduleLivestream(
    req: AuthGuardRequest,
    creatorId: number,
    currentLivestream: UpdateLivestreamRoomDTO,
    thumbnail?: string,
  ) {
    const { id: livestreamId, hasSendMail } = currentLivestream;

    if (currentLivestream.startTime < new Date()) {
      throw new BadRequestException({
        message: ErrorCode.START_TIME_MUST_GREATER_THAN_CURRENT_TIME,
      });
    }

    const oldLivestream = await this.get(req, livestreamId);
    if (oldLivestream?.creatorId != creatorId) {
      throw new UnauthorizedException();
    }

    if (
      oldLivestream?.status === LivestreamRoomStatus.END ||
      oldLivestream?.status === LivestreamRoomStatus.CANCELLED
    ) {
      throw new BadRequestException({
        message: ErrorCode.LIVESTREAM_ROOM_ENDED,
      });
    }

    const updatedLivestreamRoom = {
      ...currentLivestream,
      startTime: currentLivestream.startTime
        ? new Date(currentLivestream.startTime)
        : oldLivestream.startTime,
      thumbnail,
    };

    exclude(updatedLivestreamRoom, ['hasSendMail']);

    const newLivestreamRoom = await this.update(
      {},
      livestreamId,
      updatedLivestreamRoom,
    );

    if (hasSendMail && hasSendMail != 'false') {
      const isContentChanged = this.hasContentChanged(
        oldLivestream,
        updatedLivestreamRoom,
      );

      const scheduleEmailType = isContentChanged
        ? ScheduleEmailType.UPDATE_CONTENT
        : ScheduleEmailType.UPDATE_GUEST;

      this.sendMailScheduleLivestream({
        type: scheduleEmailType,
        newInvitedEmails: updatedLivestreamRoom.invitedEmails,
        oldInvitedMemberEmails: oldLivestream.invitedEmails,
        livestreamName: updatedLivestreamRoom.name,
        description: updatedLivestreamRoom.description,
        startTime: updatedLivestreamRoom.startTime,
        livestreamId: updatedLivestreamRoom.id,
        category: updatedLivestreamRoom.listCategory,
      });
    }

    return newLivestreamRoom;
  }

  async deleteScheduleLiveStream(
    req: AuthGuardRequest,
    creatorId: number,
    query: CancelLivestreamRoomDto,
  ) {
    const { id: livestreamId, hasSendMail } = query;
    req.query = {};
    const oldLivestream = await this.get(req, livestreamId);
    if (oldLivestream?.creatorId != creatorId) {
      throw new UnauthorizedException();
    }

    if (
      oldLivestream?.status === LivestreamRoomStatus.END ||
      oldLivestream?.status === LivestreamRoomStatus.CANCELLED
    ) {
      throw new BadRequestException({
        message: ErrorCode.LIVESTREAM_ROOM_ENDED,
      });
    }

    if (oldLivestream?.status === LivestreamRoomStatus.LIVE) {
      throw new BadRequestException({
        message: ErrorCode.CAN_NOT_CANCEL_LIVE_ROOM,
      });
    }

    const updatedLivestreamRoom = {
      status: LivestreamRoomStatus.CANCELLED,
    };

    await this.update({}, livestreamId, updatedLivestreamRoom);

    if (hasSendMail) {
      this.sendMailScheduleLivestream({
        type: ScheduleEmailType.CANCEL,
        newInvitedEmails: oldLivestream.invitedEmails,
        oldInvitedMemberEmails: oldLivestream.invitedEmails,
        livestreamName: oldLivestream.name,
        description: oldLivestream.description,
        startTime: oldLivestream.startTime,
        livestreamId: oldLivestream.id,
        category: oldLivestream.listCategory,
      });
    }
    void this.wssGateway.handleRoomStateCancel(livestreamId);
  }
}
