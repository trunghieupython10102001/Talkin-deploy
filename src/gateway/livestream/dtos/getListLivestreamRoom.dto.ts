import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ErrorCode } from 'src/common/constants/errorcode.enum';
import { LivestreamRoomStatus } from 'src/common/constants/livestream-room.enum';

export class ListLiveStreamRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(LivestreamRoomStatus)
  status?: LivestreamRoomStatus;

  @ApiPropertyOptional()
  @IsOptional()
  order_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  name_like?: string;

  @ApiPropertyOptional()
  @IsOptional()
  'creator.fullname_like'?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  listCategory_has?: string[];
}
