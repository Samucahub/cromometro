import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StatusesService } from './statuses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateStatusDto } from './dto/create-status.dto';

@UseGuards(JwtAuthGuard)
@Controller('statuses')
export class StatusesController {
  constructor(private service: StatusesService) {}

  @Post()
  create(@CurrentUser() user, @Body() dto: CreateStatusDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.service.findAll(user.id);
  }

  @Patch('reorder')
  reorder(@CurrentUser() user, @Body() body: { statusIds: string[] }) {
    return this.service.reorder(user.id, body.statusIds);
  }

  @Delete(':id')
  delete(@CurrentUser() user, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }
}
