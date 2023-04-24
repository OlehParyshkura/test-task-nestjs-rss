import { Module } from '@nestjs/common';
import { UpdaterController } from './updater.controller';
import { UpdaterService } from './updater.service';
import { HttpModule } from '@nestjs/axios';
import { PostModule } from '../post/post.module';

@Module({
  imports: [HttpModule, PostModule],
  controllers: [UpdaterController],
  providers: [UpdaterService],
})
export class UpdaterModule {}
