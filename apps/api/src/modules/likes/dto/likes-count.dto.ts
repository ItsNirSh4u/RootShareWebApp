import { ApiProperty } from '@nestjs/swagger';

export class LikesCountDto {
  @ApiProperty({
    description: 'The total number of likes for the post.',
    example: 10,
  })
  likes: number;
}
