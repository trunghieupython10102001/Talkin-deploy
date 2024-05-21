import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SignInWithWalletDTO {
  @ApiProperty()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  signMessage: string;
}
