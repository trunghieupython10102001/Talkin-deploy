import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateBy,
  isEmail,
} from 'class-validator';
import { ErrorCode } from 'src/common/constants/errorcode.enum';

enum UpdateLivestreamRoomStatus {
  LIVE = 'live',
  COMING_SOON = 'coming_soon',
  END = 'end',
}

export class UpdateLivestreamRoomDTO {
  @ApiProperty()
  @IsNotEmpty({ message: ErrorCode.ID_IS_NOT_EMPTY })
  @IsString({ message: ErrorCode.ID_IS_NOT_STRING })
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(255, {
    message: ErrorCode.NAME_IS_TOO_LONG,
  })
  @IsString({
    message: ErrorCode.NAME_IS_NOT_STRING,
  })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString(undefined, { message: ErrorCode.DATE_STRING_INVALID })
  startTime: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(1000, {
    message: ErrorCode.DESCRIPTION_IS_TOO_LONG,
  })
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateBy({
    name: 'invitedEmails',
    validator: {
      validate: (value, args: any) => {
        const invitedEmails = args.object.invitedEmails;
        let checkEmail = true;
        invitedEmails.forEach((email: any) => {
          if (
            typeof email !== 'string' ||
            !isEmail(email, { domain_specific_validation: true })
          )
            checkEmail = false;
        });
        return checkEmail;
      },
      defaultMessage: () => ErrorCode.EMAIL_INVALID,
    },
  })
  @IsArray()
  invitedEmails?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ArrayMaxSize(3)
  @IsArray()
  listCategory?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ApiPropertyOptional({
    format: 'binary',
    type: 'string',
  })
  thumbnail: Express.Multer.File;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: ErrorCode.HAS_SEND_MAIL_INVALID })
  hasSendMail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(UpdateLivestreamRoomStatus)
  status?: UpdateLivestreamRoomStatus;
}
