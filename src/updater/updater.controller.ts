import {
  Cron,
  CronExpression,
} from '@nestjs/schedule';
import { UpdaterService } from './updater.service';
import { Controller } from '@nestjs/common';

@Controller()
export class UpdaterController {
  constructor(
    private updaterService: UpdaterService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  updatePosts() {
    return this.updaterService.updatePosts();
  }
}
