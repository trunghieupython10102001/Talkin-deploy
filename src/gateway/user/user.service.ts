import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { BaseService } from 'src/common/base/base.service';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthGuardRequest } from '../auth/guards/auth.guard';
import { UpdateUserWalletDto } from 'src/gateway/user/dtos/update-user-wallet';
import { ethers } from 'ethers';

@Injectable()
export class UserService extends BaseService {
  constructor(prisma: PrismaService, configService: ConfigService) {
    super(prisma, 'user', 'User', configService);
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
    const updateUser: UpdateUserDto = {
      email: updateUserDto.email,
      firstname: updateUserDto.firstname,
      lastname: updateUserDto.lastname,
      birthday: updateUserDto.birthday || null,
      gender: updateUserDto.gender || null,
      phone: updateUserDto.phone || null,
      address: updateUserDto.address || null,
      description: updateUserDto.description || null,
    };
    await this.update({}, userId, {
      ...updateUser,
      fullname: updateUserDto.firstname + ' ' + updateUserDto.lastname,
    });
  }

  async getProfile(request: AuthGuardRequest, userId: number) {
    const user = await this.get(request, userId);
    delete user.password;
    return user;
  }

  async connectWalletToAccount(
    userId: number,
    walletInfo: UpdateUserWalletDto,
  ) {
    const isWalletAddress = ethers.isAddress(walletInfo.address);
    if (!isWalletAddress) {
      throw new BadRequestException({
        message: 'Invalid wallet address',
      });
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        wallet: walletInfo.address,
        NOT: {
          id: userId,
        },
      },
    });

    if (user) {
      throw new BadRequestException({
        message: 'Wallet has been connected',
      });
    }

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        wallet: walletInfo.address,
      },
    });

    return {
      status: HttpStatus.OK,
    };
  }
}
