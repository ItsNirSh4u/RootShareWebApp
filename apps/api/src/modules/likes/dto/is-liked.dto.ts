import { ApiProperty } from '@nestjs/swagger';

export class IsLikedDto {
  @ApiProperty({
    description: 'Whether the post is liked by the user.',
    example: true,
  })
  liked: boolean;
}
