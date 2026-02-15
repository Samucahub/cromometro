import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCollaborativeProjectDto } from './dto/create-collaborative-project.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private async getProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const isOwner = project.userId === userId;
    const member = project.members.find((m) => m.userId === userId);

    if (!isOwner && !member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const role = isOwner ? ProjectRole.OWNER : member?.role;
    return { project, role };
  }

  async create(userId: string, dto: CreateProjectDto) {
    const maxOrder = await this.prisma.project.aggregate({
      where: { userId, statusId: dto.statusId },
      _max: { order: true },
    });

    return this.prisma.project.create({
      data: {
        ...dto,
        userId,
        isCollaborative: false, // Explicitly mark as simple project
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        status: true,
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { 
        userId,
        isCollaborative: false, // Only simple projects
      },
      include: {
        status: true,
        tasks: {
          orderBy: { order: 'asc' },
          include: {
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
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        status: true,
        tasks: {
          orderBy: { order: 'asc' },
          include: {
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
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    if (dto.statusId) {
      const maxOrder = await this.prisma.project.aggregate({
        where: { userId, statusId: dto.statusId },
        _max: { order: true },
      });
      dto.order = (maxOrder._max.order ?? -1) + 1;
    }

    return this.prisma.project.updateMany({
      where: { id, userId },
      data: dto,
    });
  }

  async delete(userId: string, id: string) {
    return this.prisma.project.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Create a collaborative project
   */
  async createCollaborativeProject(userId: string, dto: CreateCollaborativeProjectDto) {
    // Create the project
    const project = await this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        userId, // Project owner
        isCollaborative: true,
      },
    });

    // Initialize default statuses for this collaborative project
    await this.prisma.status.createMany({
      data: [
        { name: 'To Do', order: 0, userId, projectId: project.id },
        { name: 'In Progress', order: 1, userId, projectId: project.id },
        { name: 'Done', order: 2, userId, projectId: project.id },
      ],
      skipDuplicates: true,
    });

    // Add the creator as project owner
    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: ProjectRole.OWNER,
      },
    });

    // Add other members if provided
    if (dto.memberIds && dto.memberIds.length > 0) {
      for (const memberId of dto.memberIds) {
        if (memberId !== userId) {
          await this.prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: memberId,
              role: ProjectRole.EDITOR,
            },
          });
        }
      }
    }

    // Send invitations if emails provided
    if (dto.memberEmails && dto.memberEmails.length > 0) {
      for (const email of dto.memberEmails) {
        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user && user.id !== userId) {
          // Check if already a member
          const existingMember = await this.prisma.projectMember.findUnique({
            where: {
              userId_projectId: {
                projectId: project.id,
                userId: user.id,
              },
            },
          });

          if (!existingMember) {
            await this.prisma.projectInvitation.create({
              data: {
                projectId: project.id,
                email,
                invitedById: userId,
                role: ProjectRole.EDITOR,
              },
            });
          }
        }
      }
    }

    return this.getCollaborativeProjectDetail(userId, project.id);
  }

  /**
   * Get all projects accessible by a user (owns or is member of)
   */
  async findAllAccessible(userId: string) {
    // Get collaborative projects owned by user
    const ownedProjects = await this.prisma.project.findMany({
      where: {
        userId,
        isCollaborative: true,
      },
      include: {
        _count: {
          select: { tasks: true, members: true },
        },
        members: {
          select: {
            userId: true,
            user: {
              select: { name: true, email: true },
            },
            role: true,
          },
        },
      },
    });

    // Get collaborative projects where user is a member
    const memberProjects = await this.prisma.project.findMany({
      where: {
        isCollaborative: true,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        _count: {
          select: { tasks: true, members: true },
        },
        members: {
          select: {
            userId: true,
            user: {
              select: { name: true, email: true },
            },
            role: true,
          },
        },
      },
    });

    const combined = [...ownedProjects, ...memberProjects];
    const uniqueById = new Map<string, (typeof combined)[number]>();

    for (const project of combined) {
      uniqueById.set(project.id, project);
    }

    return Array.from(uniqueById.values());
  }

  /**
   * Get detailed view of a collaborative project
   */
  async getCollaborativeProjectDetail(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        status: true,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // Check user access
    const isOwner = project.userId === userId;
    const isMember = project.members.some(m => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Get user's role
    const userRole = isOwner ? ProjectRole.OWNER : project.members.find(m => m.userId === userId)?.role;

    return {
      ...project,
      userRole,
    };
  }

  /**
   * Get statuses for a collaborative project (owner's statuses)
   */
  async getProjectStatuses(userId: string, projectId: string) {
    const { project } = await this.getProjectAccess(userId, projectId);

    // Get statuses scoped to this project + any statuses already used by its tasks (backward compatibility)
    const [projectStatuses, taskStatuses] = await Promise.all([
      this.prisma.status.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.status.findMany({
        where: {
          tasks: {
            some: { projectId },
          },
        },
        orderBy: { order: 'asc' },
      }),
    ]);

    if (projectStatuses.length === 0 && taskStatuses.length === 0) {
      await this.prisma.status.createMany({
        data: [
          { name: 'To Do', order: 0, userId: project.userId, projectId },
          { name: 'In Progress', order: 1, userId: project.userId, projectId },
          { name: 'Done', order: 2, userId: project.userId, projectId },
        ],
        skipDuplicates: true,
      });

      const seeded = await this.prisma.status.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
      });

      return seeded;
    }

    const statusMap = new Map<string, any>();

    for (const status of projectStatuses) {
      statusMap.set(status.id, status);
    }

    for (const status of taskStatuses) {
      statusMap.set(status.id, status);
    }

    return Array.from(statusMap.values());
  }

  /**
   * Create a status for a collaborative project (owner's statuses)
   */
  async createProjectStatus(userId: string, projectId: string, name: string) {
    const { project, role } = await this.getProjectAccess(userId, projectId);

    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to create statuses');
    }

    const existing = await this.prisma.status.findFirst({
      where: { projectId, name },
    });

    if (existing) {
      throw new BadRequestException('Status já existe neste projeto');
    }

    const maxOrder = await this.prisma.status.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    return this.prisma.status.create({
      data: {
        name,
        userId: project.userId,
        projectId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  /**
   * Reorder statuses for a collaborative project
   */
  async reorderProjectStatuses(userId: string, projectId: string, statusIds: string[]) {
    const { role } = await this.getProjectAccess(userId, projectId);

    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to reorder statuses');
    }

    if (!Array.isArray(statusIds) || statusIds.length === 0) {
      throw new BadRequestException('Lista de status inválida');
    }

    const uniqueIds = new Set(statusIds);
    if (uniqueIds.size !== statusIds.length) {
      throw new BadRequestException('Lista de status inválida');
    }

    const existing = await this.prisma.status.findMany({
      where: { id: { in: statusIds }, projectId },
      select: { id: true },
    });

    if (existing.length !== statusIds.length) {
      throw new BadRequestException('Alguns status não pertencem ao projeto');
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

  /**
   * Delete a status for a collaborative project (owner's statuses)
   */
  async deleteProjectStatus(userId: string, projectId: string, statusId: string) {
    const { project, role } = await this.getProjectAccess(userId, projectId);

    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to delete statuses');
    }

    return this.prisma.status.deleteMany({
      where: { id: statusId, projectId, userId: project.userId },
    });
  }

  /**
   * Update a collaborative project
   */
  async updateCollaborativeProject(userId: string, projectId: string, dto: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Only project owner can update project');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        title: dto.title || project.title,
        description: dto.description !== undefined ? dto.description : project.description,
      },
      include: {
        members: true,
        tasks: true,
      },
    });
  }

  /**
   * Delete a collaborative project
   */
  async deleteCollaborativeProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Only project owner can delete project');
    }

    // Delete all associated data
    await this.prisma.projectInvitation.deleteMany({
      where: { projectId },
    });

    await this.prisma.projectMember.deleteMany({
      where: { projectId },
    });

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }
}
