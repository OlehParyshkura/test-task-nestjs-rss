import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PostModule } from './post/post.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UpdaterModule } from './updater/updater.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    PostModule,
    UpdaterModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
  ],
  exports: [],
})
export class AppModule {}
