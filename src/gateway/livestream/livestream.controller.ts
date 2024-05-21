import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LivestreamRoomService } from './livestream.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../auth/decorator/public';
import { AuthGuardRequest } from '../auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ListLiveStreamRoomDto } from './dtos/getListLivestreamRoom.dto';
import { UpdateLivestreamRoomDTO } from './dtos/updateLivestreamRoom.dto';
import { CreateLiveStreamRoomDto } from './dtos/createLivestreamRoom.dto';
import { CancelLivestreamRoomDto } from './dtos/cancelLivestreamRoom.dto';

@ApiTags('livestream')
@Controller('livestream')
export class LiveStreamRoomController {
  constructor(private readonly livestreamRoomService: LivestreamRoomService) {}

  @Public()
  @Get('')
  @ApiQuery({ type: ListLiveStreamRoomDto })
  getAll(@Req() req: Request) {
    return this.livestreamRoomService.getAllLivestream(req);
  }

  @Public()
  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    return this.livestreamRoomService.getLiveStreamRoomById(req, id);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      storage: diskStorage({
        destination: './uploads/live-thumbnail',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiBody({
    type: CreateLiveStreamRoomDto,
  })
  @Post()
  async createLivestreamRoom(
    @UploadedFile('file') thumbnail: Express.Multer.File,
    @Req() req: AuthGuardRequest,
    @Body() createLiveStreamRoomDto: CreateLiveStreamRoomDto,
  ) {
    const newLiveStream = await this.livestreamRoomService.createLiveStreamRoom(
      req.user.id,
      createLiveStreamRoomDto,
      thumbnail?.path,
    );

    return newLiveStream;
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      storage: diskStorage({
        destination: './uploads/live-thumbnail',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiBody({
    type: UpdateLivestreamRoomDTO,
  })
  @Put('/schedule')
  async updateScheduleLivestream(
    @UploadedFile('file') thumbnail: Express.Multer.File,
    @Req() req: AuthGuardRequest,
    @Body() liveStream: UpdateLivestreamRoomDTO,
  ) {
    return this.livestreamRoomService.updateScheduleLivestream(
      req,
      req.user.id,
      liveStream,
      thumbnail?.path,
    );
  }

  @ApiBearerAuth()
  @Delete('/schedule')
  async deleteScheduleLivestream(
    @Req() req: AuthGuardRequest,
    @Query() query: CancelLivestreamRoomDto,
  ) {
    return this.livestreamRoomService.deleteScheduleLiveStream(
      req,
      req.user.id,
      query,
    );
  }
}
