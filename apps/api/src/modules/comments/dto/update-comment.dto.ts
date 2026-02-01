import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'The updated content of the comment',
    example: 'I have updated my comment.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
