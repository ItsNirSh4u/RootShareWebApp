import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUsersDto {
  @ApiProperty({
    description: 'The search query to find users by username or name.',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  query: string;
}
