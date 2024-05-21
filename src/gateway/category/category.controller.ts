import { Controller, Get, Req, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../auth/decorator/public';
import { CategoryService } from '../category/category.service';
import { CreateCategoryDTO } from './dtos/create-category.dto';

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get('')
  async getCategory(@Req() req: Request) {
    return this.categoryService.getAll(req);
  }

  @ApiBody({
    type: CreateCategoryDTO,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth()
  @Post()
  async createCategory(@Body() body: CreateCategoryDTO) {
    return this.categoryService.create(body);
  }
}
