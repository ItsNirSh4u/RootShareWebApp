import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDescriptionDto {
  @ApiPropertyOptional({
    description: 'New description for the group chat (empty string or null clears it).',
    example: 'A place to share plant care tips',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
