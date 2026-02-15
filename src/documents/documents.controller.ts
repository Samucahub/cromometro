import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Request() req, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(req.user.id, createDocumentDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string
  ) {
    return this.documentsService.findAll(req.user.id, { projectId, taskId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDocumentDto: UpdateDocumentDto
  ) {
    return this.documentsService.update(id, req.user.id, updateDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.documentsService.remove(id, req.user.id);
  }
}
