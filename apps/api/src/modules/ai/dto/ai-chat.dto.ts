import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'model'] })
  @IsString()
  role: 'user' | 'model';

  @ApiProperty()
  @IsString()
  content: string;
}

export class AiChatDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ type: [ChatMessageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @ApiPropertyOptional({ description: 'Server-side path to an already-uploaded image' })
  @IsOptional()
  @IsString()
  imagePath?: string;
}
