import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Serviço para gerenciar refresh tokens
 * Permite renovação segura de access tokens
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Gera um novo refresh token para um utilizador
   * @param userId ID do utilizador
   * @returns Objeto com token e expiresAt
   */
  async generateRefreshToken(userId: string) {
    const expiresInDays = this.configService.get('REFRESH_TOKEN_EXPIRY_DAYS', 30);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Gerar payload do JWT
    const payload = {
      sub: userId,
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET', 'default-refresh-secret'),
      expiresIn: `${expiresInDays}d`,
    });

    // Armazenar refresh token na base de dados
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return {
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
    };
  }

  /**
   * Valida um refresh token
   * @param token Refresh token a validar
   * @returns Dados do token ou null se inválido
   */
  async validateRefreshToken(token: string) {
    try {
      // Verificar se token existe na base de dados
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      // Validar que existe, não foi revogado, e não expirou
      if (
        !refreshToken ||
        refreshToken.revoked ||
        refreshToken.expiresAt < new Date()
      ) {
        return null;
      }

      // Verificar assinatura JWT
      try {
        this.jwtService.verify(token, {
          secret: this.configService.get(
            'REFRESH_TOKEN_SECRET',
            'default-refresh-secret',
          ),
        });
      } catch {
        return null;
      }

      return refreshToken;
    } catch {
      return null;
    }
  }

  /**
   * Revoga um refresh token
   * @param token Refresh token a revogar
   */
  async revokeRefreshToken(token: string) {
    return await this.prisma.refreshToken.update({
      where: { token },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoga todos os refresh tokens de um utilizador
   * Útil para logout em todos os dispositivos
   * @param userId ID do utilizador
   */
  async revokeAllUserTokens(userId: string) {
    return await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Limpa refresh tokens expirados
   * Executar periodicamente para manter a DB limpa
   */
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      deleted: result.count,
    };
  }

  /**
   * Rotaciona um refresh token (segurança)
   * Revoga o antigo e gera um novo
   * @param oldToken Token antigo
   * @param userId ID do utilizador
   * @returns Novo refresh token
   */
  async rotateRefreshToken(oldToken: string, userId: string) {
    // Validar token antigo
    const refreshToken = await this.validateRefreshToken(oldToken);
    if (!refreshToken || refreshToken.userId !== userId) {
      return null;
    }

    // Revogar token antigo
    await this.revokeRefreshToken(oldToken);

    // Gerar novo token
    return this.generateRefreshToken(userId);
  }
}
