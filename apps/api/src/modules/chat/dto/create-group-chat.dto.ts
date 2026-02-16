import { IsArray, IsMongoId, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupChatDto {
  @ApiProperty({
    description: 'Name of the group chat.',
    example: 'Plant Lovers',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Array of user IDs to add (at least 1 other user).',
    example: ['60d21b4667d0d8992e610c85'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  userIds: string[];
}
