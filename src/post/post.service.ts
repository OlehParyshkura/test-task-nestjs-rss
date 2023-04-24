import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    search?: string,
    page = 1,
    limit = 10,
    sort?: string,
    filter?: Record<string, any>,
  ) {
    const take = +limit > 100 ? 100 : +limit;
    const skip = (page - 1) * take;
    let where;
    if (search) {
      where = {
        OR: [
          {
            title: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            link: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      };
    }
    if (filter) {
      where = { ...filter, where };
    }

    let orderBy;
    if (sort && sort.includes(':')) {
      const [field, order] = sort.split(':');
      orderBy = { [field]: order };
    }

    const posts = await this.prisma.post.findMany(
      {
        where,
        orderBy,
        skip,
        take,
      },
    );

    const total = await this.prisma.post.count({
      where,
    });

    return { data: posts, total };
  }

  async findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  async create(createPostDto: CreatePostDto) {
    try {
      return await this.prisma.post.create({
        data: createPostDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Handle unique constraint violation error
        throw new ConflictException(
          'Post with this link already exists.',
        );
      }
      throw error;
    }
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
  ) {
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: number) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
