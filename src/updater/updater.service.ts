import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PostService } from '../post/post.service';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

@Injectable()
export class UpdaterService {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly postService: PostService,
  ) {}

  async updatePosts() {
    const posts = await this.fetchPosts();
    for (const post of posts) {
      try {
        const postDto =
          await this.generatePostDto(post);
        await this.postService.create(postDto);
      } catch (e) {
        if (e instanceof ConflictException) {
          //do nothing
        }
        throw e;
      }
    }
  }

  private async fetchPosts() {
    const token = this.config.get('RSS_TOKEN');
    const link = this.config.get('FEED_LINK');
    const parser = new XMLParser();

    const responseXML = await firstValueFrom(
      this.httpService.get(link, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
    const response = parser.parse(
      responseXML.data,
    );
    const posts = response?.rss?.channel?.item;
    return posts || [];
  }

  private async generatePostDto(
    post,
  ): Promise<CreatePostDto> {
    const pubDate = new Date(
      post.pubDate,
    ).toISOString();

    const objInstance = plainToInstance(
      CreatePostDto,
      {
        title: post.title,
        description: post.description,
        link: post.link,
        pubDate,
      },
    );
    await validateOrReject(objInstance);
    return objInstance;
  }
}
