import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateUserRole(userId: string, role: string, currentUserId: string) {
    // Prevent admin from changing their own role
    if (userId === currentUserId) {
      throw new ForbiddenException('Não podes alterar o teu próprio role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, name: true, username: true, email: true, role: true },
    });
  }

  async deleteUser(userId: string, currentUserId: string, confirmed: boolean) {
    // Prevent admin from deleting themselves
    if (userId === currentUserId) {
      throw new ForbiddenException('Não podes eliminar a tua própria conta');
    }

    // Require explicit confirmation
    if (!confirmed) {
      throw new BadRequestException('Eliminação de utilizador requer confirmação explícita. Enviar { "confirmed": true }');
    }

    // Delete related records that don't have cascade delete
    await this.prisma.internship.deleteMany({ where: { userId } });
    await this.prisma.timeEntry.deleteMany({ where: { userId } });

    // Delete user (remaining relations have cascade delete)
    return this.prisma.user.delete({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true },
    });
  }
}
