import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { AdminModule } from './admin/admin.module';
import { InternshipModule } from './intership/internship.module';
import { ProjectsModule } from './projects/projects.module';
import { StatusesModule } from './statuses/statuses.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { AuthRateLimitMiddleware } from './common/middleware/auth-rate-limit.middleware';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ReportsModule,
    TasksModule,
    TimeEntriesModule,
    AdminModule,
    InternshipModule,
    ProjectsModule,
    StatusesModule,
    UsersModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar rate limit específico de auth
    consumer.apply(AuthRateLimitMiddleware).forRoutes('auth');

    // Aplicar rate limit global a todos os endpoints
    consumer.apply(RateLimitMiddleware.globalLimiter).forRoutes('*');
  }
}
