import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenameGroupDto {
  @ApiProperty({
    description: 'New group name.',
    example: 'Cactus Club',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
