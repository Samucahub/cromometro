import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, userId: string, limit: number = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: limit,
    });
  }
}
