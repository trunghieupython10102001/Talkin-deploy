import { ErrorCode } from 'src/common/constants/errorcode.enum';
import { CreateUserDto } from 'src/gateway/user/dtos/create-user.dto';
import { hashPasswordString } from 'src/common/utils/utils';
import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInDTO } from './dtos/sign-in.dto';
import { comparePassword } from '../../common/utils/utils';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { SignInWithWalletDTO } from './dtos/sign-in-wallet.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signIn(input: SignInDTO) {
    const { email, password } = input;

    const user = await this.prismaService.user.findFirst({ where: { email } });

    if (!user)
      throw new HttpException(
        `email or password is wrong`,
        HttpStatus.BAD_REQUEST,
      );

    const isMatchedPassword = await comparePassword(password, user.password);
    if (!isMatchedPassword)
      throw new HttpException(
        `email or password is wrong`,
        HttpStatus.BAD_REQUEST,
      );

    const payload = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signInWithWallet(authCredentials: SignInWithWalletDTO) {
    const signingWallet = ethers.verifyMessage(
      this.config.get('WALLET_SIGN_MESSAGE'),
      authCredentials.signMessage,
    );

    const walletAddress = authCredentials.walletAddress;

    if (walletAddress.toLowerCase() !== signingWallet.toLowerCase()) {
      throw new BadRequestException('Invalid wallet address');
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        wallet: walletAddress,
      },
    });

    if (!user) {
      throw new HttpException('user not exist', HttpStatus.NOT_FOUND);
    }

    const payload = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(userDto: CreateUserDto) {
    userDto.email = userDto.email.toLowerCase().trim();
    const user = await this.prismaService.user.findFirst({
      select: { id: true },
      where: { email: userDto.email },
    });
    if (user) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_EXISTED,
      });
    }

    userDto.password = await hashPasswordString(userDto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        ...userDto,
        fullname: userDto.firstname + ' ' + userDto.lastname,
      },
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
