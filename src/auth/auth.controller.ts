import { Controller, Post, Body, Headers, UseGuards, Get, Req, Res, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';import { RefreshTokenDto } from './dto/refresh-token.dto';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-code')
  resendCode(@Body() dto: ResendVerificationCodeDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This method is called when Google redirects to the callback URL
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.handleOAuthCallback({
      provider: 'google',
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    });

    // Redirect to frontend with token
    const token = result.access_token;
    const role = result.role;
    res.redirect(`http://localhost:3000/auth/callback?token=${token}&role=${role}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // This method is called when GitHub redirects to the callback URL
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.handleOAuthCallback({
      provider: 'github',
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    });

    // Redirect to frontend with token
    const token = result.access_token;
    const role = result.role;
    res.redirect(`http://localhost:3000/auth/callback?token=${token}&role=${role}`);
  }

  @Post('register-admin')
  registerAdmin(
    @Body() dto: RegisterDto,
    @Headers('x-setup-key') setupKey?: string,
  ) {
    return this.authService.registerAdmin(dto, setupKey);
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto);
  }

  @Post('logout')
  async logout(@Body() body: { refresh_token?: string }) {
    return this.authService.logout(body.refresh_token || '');
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  async logoutAll(@Req() req) {
    const userId = req.user.sub || req.user.id;
    return this.authService.logoutAll(userId);
  }
}
