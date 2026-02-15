import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    const { assignedToId, assignedToIds, ...rest } = dto;
    const maxOrder = await this.prisma.task.aggregate({
      where: { userId, statusId: rest.statusId, projectId: rest.projectId || null },
      _max: { order: true },
    });

    return this.prisma.task.create({
      data: {
        ...rest,
        userId,
        order: (maxOrder._max.order ?? -1) + 1,
        assignees: normalizedAssignees?.length
          ? {
              createMany: {
                data: normalizedAssignees.map((assigneeId) => ({ userId: assigneeId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, includeCollaborative = false) {
    const filters: any[] = [
      {
        userId,
        projectId: null, // Standalone tasks (no project)
      },
      {
        project: {
          isCollaborative: false,
          userId, // Only tasks from simple projects the user owns
        },
      },
    ];

    if (includeCollaborative) {
      filters.push({
        project: {
          isCollaborative: true,
          OR: [
            { userId }, // User owns the collaborative project
            { members: { some: { userId } } }, // User is a member
          ],
        },
      });
    }

    return this.prisma.task.findMany({
      where: { OR: filters },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { assignees: { some: { userId } } },
        ],
      },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    const { assignedToId, assignedToIds, ...rest } = dto;
    if (rest.statusId) {
      const maxOrder = await this.prisma.task.aggregate({
        where: { userId, statusId: rest.statusId },
        _max: { order: true },
      });
      rest.order = (maxOrder._max.order ?? -1) + 1;
    }

    if (normalizedAssignees) {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.task.updateMany({
          where: { id, userId },
          data: rest,
        });

        await tx.taskAssignee.deleteMany({ where: { taskId: id } });

        if (normalizedAssignees.length > 0) {
          await tx.taskAssignee.createMany({
            data: normalizedAssignees.map((assigneeId) => ({ taskId: id, userId: assigneeId })),
            skipDuplicates: true,
          });
        }

        return tx.task.findUnique({
          where: { id },
          include: {
            status: true,
            project: true,
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      });

      return updated;
    }

    return this.prisma.task.updateMany({
      where: { id, userId },
      data: rest,
    });
  }

  async delete(userId: string, id: string) {
    return this.prisma.task.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Create a task in a collaborative project
   */
  async createProjectTask(userId: string, projectId: string, dto: CreateTaskDto) {
    if (!dto.statusId) {
      throw new BadRequestException('Status é obrigatório');
    }
    // Check if user has access to project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Check if user has edit permission
    if (!isOwner && isMember) {
      if (isMember.role === ProjectRole.VIEWER) {
        throw new ForbiddenException('You do not have permission to create tasks in this project');
      }
    }

    const maxOrder = await this.prisma.task.aggregate({
      where: { projectId, statusId: dto.statusId },
      _max: { order: true },
    });

    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    if (normalizedAssignees?.length) {
      const allowedMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId,
          userId: { in: normalizedAssignees },
        },
        select: { userId: true },
      });
      const allowedIds = new Set([project.userId, ...allowedMembers.map((m) => m.userId)]);
      const invalid = normalizedAssignees.filter((id) => !allowedIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException('Assigned users must be members of the project');
      }
    }

    const { assignedToId, assignedToIds, ...rest } = dto;
    const data = {
      ...rest,
      projectId,
      userId,
      order: (maxOrder._max.order ?? -1) + 1,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignees: normalizedAssignees?.length
        ? {
            createMany: {
              data: normalizedAssignees.map((assigneeId) => ({ userId: assigneeId })),
              skipDuplicates: true,
            },
          }
        : undefined,
    };

    return this.prisma.task.create({
      data,
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all tasks in a project
   */
  async getProjectTasks(userId: string, projectId: string) {
    // Check if user has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Update a project task
   */
  async updateProjectTask(userId: string, projectId: string, taskId: string, dto: UpdateTaskDto) {
    // Check if user has edit access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!isOwner && isMember && isMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to edit tasks in this project');
    }

    if (dto.statusId) {
      const maxOrder = await this.prisma.task.aggregate({
        where: { projectId, statusId: dto.statusId },
        _max: { order: true },
      });
      dto.order = (maxOrder._max.order ?? -1) + 1;
    }

    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    if (normalizedAssignees?.length) {
      const allowedMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId,
          userId: { in: normalizedAssignees },
        },
        select: { userId: true },
      });
      const allowedIds = new Set([project.userId, ...allowedMembers.map((m) => m.userId)]);
      const invalid = normalizedAssignees.filter((id) => !allowedIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException('Assigned users must be members of the project');
      }
    }

    const { assignedToId, assignedToIds, ...rest } = dto;

    const updateData = {
      ...rest,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    if (normalizedAssignees) {
      return this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: taskId },
          data: updateData,
        });

        await tx.taskAssignee.deleteMany({ where: { taskId } });

        if (normalizedAssignees.length > 0) {
          await tx.taskAssignee.createMany({
            data: normalizedAssignees.map((assigneeId) => ({ taskId, userId: assigneeId })),
            skipDuplicates: true,
          });
        }

        return tx.task.findUnique({
          where: { id: taskId },
          include: {
            status: true,
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      });
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete a project task
   */
  async deleteProjectTask(userId: string, projectId: string, taskId: string) {
    // Check if user has edit access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!isOwner && isMember && isMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to delete tasks in this project');
    }

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}
