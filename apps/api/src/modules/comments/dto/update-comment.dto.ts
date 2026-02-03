import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'The ID of the comment to update',
    example: '60c72b9f9b1d8c001f8e4a2a',
  })
  @IsMongoId()
  @IsNotEmpty()
  commentId: string;

  @ApiProperty({
    description: 'The updated content of the comment',
    example: 'I have updated my comment.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}