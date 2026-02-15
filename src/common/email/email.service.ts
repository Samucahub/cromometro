import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Configure Nodemailer with environment variables
    const mailSecure = `${this.configService.get('MAIL_SECURE', 'false')}`.toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'localhost'),
      port: this.configService.get('MAIL_PORT', 1025),
      secure: mailSecure,
      auth: this.configService.get('MAIL_USER')
        ? {
            user: this.configService.get('MAIL_USER'),
            pass: this.configService.get('MAIL_PASS'),
          }
        : undefined,
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@semstress.com'),
        to: email,
        subject: 'Código de Verificação - SEMSTRESS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verificação de Email</h2>
            <p style="color: #666; font-size: 16px;">
              Obrigado por te registares no SEMSTRESS! Para completar o teu registo, utiliza o seguinte código:
            </p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; margin: 0;">
                ${code}
              </p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Este código expira em 15 minutos. Se não solicitaste este código, ignora este email.
            </p>
            <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
              © 2026 SEMSTRESS. Gestão de estágios simplificada.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@semstress.com'),
        to: email,
        subject: 'Bem-vindo ao SEMSTRESS!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bem-vindo, ${name}!</h2>
            <p style="color: #666; font-size: 16px;">
              A tua conta foi criada com sucesso. Já podes começar a usar o SEMSTRESS para gerir os teus estágios.
            </p>
            <p style="color: #666; font-size: 14px;">
              Se tiveres dúvidas, não hesites em contactar-nos.
            </p>
            <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
              © 2026 SEMSTRESS. Gestão de estágios simplificada.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }
}
