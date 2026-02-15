import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';

@Injectable()
export class StatusesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateStatusDto) {
    const existing = await this.prisma.status.findFirst({
      where: { userId, name: dto.name, projectId: null },
    });

    if (existing) {
      throw new BadRequestException('Status já existe');
    }

    const maxOrder = await this.prisma.status.aggregate({
      where: { userId, projectId: null },
      _max: { order: true },
    });

    return this.prisma.status.create({
      data: {
        name: dto.name,
        userId,
        projectId: null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.status.findMany({
      where: { userId, projectId: null },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            tasks: true,
            projects: true,
          },
        },
      },
    });
  }

  async delete(userId: string, id: string) {
    const count = await this.prisma.status.count({
      where: { userId, projectId: null },
    });

    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last status');
    }

    const hasItems = await this.prisma.status.findFirst({
      where: { id, userId, projectId: null },
      include: {
        _count: {
          select: { tasks: true, projects: true },
        },
      },
    });

    if (hasItems && (hasItems._count.tasks > 0 || hasItems._count.projects > 0)) {
      throw new BadRequestException('Cannot delete status with tasks or projects');
    }

    return this.prisma.status.deleteMany({
      where: { id, userId, projectId: null },
    });
  }

  async reorder(userId: string, statusIds: string[]) {
    if (!Array.isArray(statusIds) || statusIds.length === 0) {
      throw new BadRequestException('Lista de status inválida');
    }

    const uniqueIds = new Set(statusIds);
    if (uniqueIds.size !== statusIds.length) {
      throw new BadRequestException('Lista de status inválida');
    }

    const existing = await this.prisma.status.findMany({
      where: { id: { in: statusIds }, userId, projectId: null },
      select: { id: true },
    });

    if (existing.length !== statusIds.length) {
      throw new BadRequestException('Alguns status não pertencem ao usuário');
    }

    await this.prisma.$transaction(
      statusIds.map((id, index) =>
        this.prisma.status.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { success: true };
  }

  async initializeDefaultStatuses(userId: string) {
    const existing = await this.prisma.status.count({
      where: { userId, projectId: null },
    });

    if (existing > 0) return;

    const defaults = [
      { name: 'To Do', order: 0 },
      { name: 'In Progress', order: 1 },
      { name: 'Done', order: 2 },
    ];

    await this.prisma.status.createMany({
      data: defaults.map((s) => ({ ...s, userId, projectId: null })),
    });
  }
}
