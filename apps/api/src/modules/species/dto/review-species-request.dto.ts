import { IsString, IsEnum, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpeciesRequestStatus } from '@rootshare/shared-types';

export class ReviewSpeciesRequestDto {
  @ApiProperty({
    description: 'The review decision',
    enum: [SpeciesRequestStatus.APPROVED, SpeciesRequestStatus.REJECTED],
    example: SpeciesRequestStatus.APPROVED,
  })
  @IsEnum([SpeciesRequestStatus.APPROVED, SpeciesRequestStatus.REJECTED])
  status: SpeciesRequestStatus.APPROVED | SpeciesRequestStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if status is rejected)',
    example: 'This species already exists under a different name',
  })
  @ValidateIf((o) => o.status === SpeciesRequestStatus.REJECTED)
  @IsString()
  rejectionReason?: string;
}
