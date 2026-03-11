import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '@rootshare/shared-types';

export class CreatePostDto {
  @ApiPropertyOptional({
    description: 'The ID of the plant associated with this post',
    example: '60c72b9f9b1d8c001f8e4a2a',
  })
  @IsOptional()
  @IsMongoId()
  plantId?: string;

  @ApiProperty({
    description: 'The type of the post',
    enum: PostType,
    example: PostType.UPDATE,
  })
  @IsEnum(PostType)
  type: PostType;

  @ApiProperty({
    description: 'The content of the post',
    example: 'My plant is growing so well!',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'A list of image URLs for the post',
    example: ['https://example.com/image1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Location for swap or giveaway posts',
    example: 'Tel Aviv, Israel',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
