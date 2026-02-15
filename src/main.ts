import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validation global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Configurar CORS com opções de segurança
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigins.map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 3600, // 1 hora
  });
  
  // Configurar Security Headers com Helmet
  app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:3001'],
      },
    },
    // HSTS - HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options - Protege contra clickjacking
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options - Previne MIME sniffing
    noSniff: true,
    // X-XSS-Protection - Proteção contra XSS
    xssFilter: true,
    // Referrer-Policy
    referrerPolicy: {
      policy: 'no-referrer',
    },
    // Permissions-Policy (Feature-Policy)
    permittedCrossDomainPolicies: false,
  }));
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`✓ Backend listening on http://localhost:${port}`);
  console.log(`✓ CORS habilitado para: ${corsOrigins.join(', ')}`);
  console.log(`✓ Security headers ativados (Helmet)`);
}
bootstrap();
