import { Module } from '@nestjs/common';
import { ShareModule } from 'src/share/share.module';
import { CategoryService } from '../category/category.service';
import { CategoryController } from './category.controller';

@Module({
  imports: [ShareModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
