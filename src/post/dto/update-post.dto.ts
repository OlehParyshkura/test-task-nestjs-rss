import {
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
} from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsUrl()
  readonly link?: string;

  @IsOptional()
  @IsDateString()
  readonly pubDate?: Date;
}
