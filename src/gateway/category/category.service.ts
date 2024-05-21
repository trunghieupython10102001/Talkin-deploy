import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { BaseService } from 'src/common/base/base.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CategoryService extends BaseService {
  constructor(prisma: PrismaService, configService: ConfigService) {
    super(prisma, 'category', 'Category', configService);
  }
}
