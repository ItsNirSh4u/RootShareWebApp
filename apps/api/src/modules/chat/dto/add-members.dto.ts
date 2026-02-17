import { IsArray, IsMongoId, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembersDto {
  @ApiProperty({
    description: 'User IDs to add to the group.',
    example: ['60d21b4667d0d8992e610c85'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  userIds: string[];
}
