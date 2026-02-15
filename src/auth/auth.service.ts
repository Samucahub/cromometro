import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { StatusesService } from '../statuses/statuses.service';
import { EmailService } from '../common/email/email.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private statusesService: StatusesService,
    private emailService: EmailService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Username ou email são obrigatórios');
    }

    if (!dto.username) {
      throw new BadRequestException('Username é obrigatório');
    }

    // Check if username already exists in User table
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('Username já está em uso');
    }

    // Check if username already exists in PendingUser table
    const existingPendingByUsername = await this.prisma.pendingUser.findUnique({
      where: { username: dto.username },
    });

    if (existingPendingByUsername) {
      throw new ConflictException('Username já está em uso');
    }

    // If email is provided, check it too
    if (dto.email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Email já registado');
      }

      const existingPendingByEmail = await this.prisma.pendingUser.findUnique({
        where: { email: dto.email },
      });

      if (existingPendingByEmail) {
        await this.prisma.pendingUser.delete({
          where: { email: dto.email },
        });
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();

    // Create pending user (not in User table yet)
    await this.prisma.pendingUser.create({
      data: {
        name: dto.name || dto.username,
        username: dto.username,
        email: dto.email || `${dto.username}@pending.local`,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    
    // Send verification email (to provided email or username@pending.local)
    const emailToSend = dto.email || `${dto.username}@pending.local`;
    if (dto.email) {
      await this.emailService.sendVerificationEmail(dto.email, verificationCode);
    }

    return {
      message: 'Conta criada com sucesso. Verifica o teu email para completar o registo.',
      requiresVerification: true,
      email: dto.email,
      username: dto.username,
    };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Username ou email são obrigatórios');
    }

    let user;
    
    // Try to find user by username first, then by email
    if (dto.username) {
      user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
    }

    if (!user && dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    }

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // If user hasn't verified email, send a new code
    if (!user.emailVerified) {
      const verificationCode = this.generateVerificationCode();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await this.emailService.sendVerificationEmail(user.email, verificationCode);

      return {
        message: 'Credenciais válidas. Verifica o teu email para completar o login.',
        requiresVerification: true,
        email: user.email,
      };
    }

    return this.signToken(user.id, user.email, user.role);
  }

  async registerAdmin(dto: RegisterDto, setupKey: string | undefined) {
    if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
      throw new UnauthorizedException('Setup inválido');
    }

    if (!dto.username) {
      throw new BadRequestException('Username é obrigatório');
    }

    const existsByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existsByUsername) {
      throw new ConflictException('Username já está em uso');
    }

    if (dto.email) {
      const existsByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existsByEmail) {
        throw new ConflictException('Email já registado');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name || dto.username,
        username: dto.username,
        email: dto.email || `${dto.username}@admin.local`,
        password: hashedPassword,
        role: 'ADMIN',
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        emailVerified: true, // Auto-verify admin
      },
    });

    await this.statusesService.initializeDefaultStatuses(user.id);

    return this.signToken(user.id, user.email, user.role);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // Check in PendingUser first
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email: dto.email },
    });

    if (pendingUser) {
      // Verify pending user registration
      if (pendingUser.verificationCodeExpiresAt < new Date()) {
        throw new BadRequestException('Código de verificação expirado');
      }

      if (pendingUser.verificationCode !== dto.code) {
        throw new BadRequestException('Código de verificação inválido');
      }

      // Create actual user
      const user = await this.prisma.user.create({
        data: {
          name: pendingUser.name,
          username: pendingUser.username,
          email: pendingUser.email,
          password: pendingUser.password,
          role: 'USER',
          emailVerified: true,
        },
      });

      // Initialize default statuses
      await this.statusesService.initializeDefaultStatuses(user.id);

      // Delete pending user
      await this.prisma.pendingUser.delete({
        where: { email: dto.email },
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.name);

      return this.signToken(user.id, user.email, user.role);
    }

    // Check in User table for existing unverified users
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado');
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      throw new BadRequestException('Não existe código de verificação pendente');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Código de verificação expirado');
    }

    if (user.verificationCode !== dto.code) {
      throw new BadRequestException('Código de verificação inválido');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.name);

    return this.signToken(updatedUser.id, updatedUser.email, updatedUser.role);
  }

  async resendVerificationCode(dto: ResendVerificationCodeDto) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Username ou email são obrigatórios');
    }

    // Check in PendingUser first (by username or email)
    let pendingUser;
    if (dto.username) {
      pendingUser = await this.prisma.pendingUser.findUnique({
        where: { username: dto.username },
      });
    }

    if (!pendingUser && dto.email) {
      pendingUser = await this.prisma.pendingUser.findUnique({
        where: { email: dto.email },
      });
    }

    if (pendingUser) {
      const verificationCode = this.generateVerificationCode();

      await this.prisma.pendingUser.update({
        where: { id: pendingUser.id },
        data: {
          verificationCode,
          verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      // Send to provided email or pendingUser email
      const emailToSend = dto.email || pendingUser.email;
      if (emailToSend && !emailToSend.endsWith('@pending.local')) {
        await this.emailService.sendVerificationEmail(emailToSend, verificationCode);
      }

      return {
        message: 'Novo código de verificação enviado para o teu email.',
      };
    }

    // Check in User table
    let user;
    if (dto.username) {
      user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
    }

    if (!user && dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'Se o utilizador existe na nossa base de dados, receberá um novo código em breve.',
      };
    }

    const verificationCode = this.generateVerificationCode();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationCode);

    return {
      message: 'Novo código de verificação enviado para o teu email.',
    };
  }

  async handleOAuthCallback(dto: OAuthCallbackDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          dto.provider === 'google' ? { googleId: dto.id } : { githubId: dto.id },
        ],
      },
    });

    if (!user) {
      // Create new user from OAuth
      // Generate unique username from email (part before @) or name
      let username = dto.email.split('@')[0];
      let counter = 1;
      
      // Check if username already exists and make it unique
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${dto.email.split('@')[0]}${counter}`;
        counter++;
      }

      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          username,
          email: dto.email,
          ...(dto.provider === 'google' ? { googleId: dto.id } : { githubId: dto.id }),
          emailVerified: true, // OAuth verified emails
          role: 'USER',
        },
      });

      await this.statusesService.initializeDefaultStatuses(user.id);
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } else {
      // Update existing user with OAuth ID if not already set
      if (dto.provider === 'google' && !user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: dto.id },
        });
      } else if (dto.provider === 'github' && !user.githubId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { githubId: dto.id },
        });
      }
    }

    return this.signToken(user.id, user.email, user.role);
  }

  private async signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    
    // Gerar access token (24 horas)
    const access_token = this.jwtService.sign(payload);
    
    // Gerar refresh token
    const refreshToken = await this.refreshTokenService.generateRefreshToken(userId);

    return {
      access_token,
      refresh_token: refreshToken.token,
      token_type: 'Bearer',
      expires_in: 24 * 60 * 60, // 24 horas em segundos
      role,
    };
  }

  /**
   * Renova access token usando um refresh token válido
   */
  async refreshAccessToken(dto: RefreshTokenDto) {
    const refreshToken = await this.refreshTokenService.validateRefreshToken(
      dto.refresh_token,
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = refreshToken.user;

    // Gerar novo access token mantendo o mesmo refresh token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      refresh_token: dto.refresh_token,
      token_type: 'Bearer',
      expires_in: 24 * 60 * 60, // 24 horas em segundos
      role: user.role,
    };
  }

  /**
   * Faz logout revogando o refresh token
   */
  async logout(refreshToken: string) {
    if (refreshToken) {
      try {
        await this.refreshTokenService.revokeRefreshToken(refreshToken);
      } catch {
        // Ignorar erro se token já foi revogado ou não existe
      }
    }

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  /**
   * Faz logout em todos os dispositivos revogando todos os refresh tokens
   */
  async logoutAll(userId: string) {
    await this.refreshTokenService.revokeAllUserTokens(userId);

    return {
      message: 'Logout realizado em todos os dispositivos',
    };
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
