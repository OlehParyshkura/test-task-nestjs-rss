import {
  IsString,
  IsUrl,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @IsNotEmpty()
  @IsUrl()
  readonly link: string;

  @IsNotEmpty()
  @IsDateString()
  readonly pubDate: Date;
}
