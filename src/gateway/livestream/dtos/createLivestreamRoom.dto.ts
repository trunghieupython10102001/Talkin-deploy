import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateBy,
} from 'class-validator';
import isEmail from 'validator/lib/isEmail';
import { ErrorCode } from 'src/common/constants/errorcode.enum';

export class CreateLiveStreamRoomDto {
  @ApiProperty()
  @MaxLength(255, {
    message: ErrorCode.NAME_IS_TOO_LONG,
  })
  @IsString({ message: ErrorCode.NAME_IS_NOT_STRING })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString(undefined, { message: ErrorCode.DATE_STRING_INVALID })
  startTime?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(1000, {
    message: ErrorCode.DESCRIPTION_IS_TOO_LONG,
  })
  @IsString({ message: ErrorCode.DESCRIPTION_IS_NOT_STRING })
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
  hasSendMail: boolean;

  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(3)
  @IsOptional()
  listCategory?: string[];

  @ApiPropertyOptional({
    format: 'binary',
    type: 'string',
  })
  @IsOptional()
  thumbnail: Express.Multer.File;
}
