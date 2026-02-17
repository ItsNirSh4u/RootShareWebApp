import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferAdminDto {
  @ApiProperty({
    description: 'User ID of the new admin.',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}
