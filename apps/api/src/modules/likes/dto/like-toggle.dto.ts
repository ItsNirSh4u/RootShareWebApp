import { ApiProperty } from '@nestjs/swagger';

export class LikeToggleDto {
  @ApiProperty({
    description: 'Whether the post is liked by the user after the toggle.',
    example: true,
  })
  liked: boolean;
}
