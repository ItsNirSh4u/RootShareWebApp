import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'The ID of the post to comment on',
    example: '60c72b9f9b1d8c001f8e4a2a',
  })
  @IsMongoId()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'The content of the comment',
    example: 'This is a great post!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
