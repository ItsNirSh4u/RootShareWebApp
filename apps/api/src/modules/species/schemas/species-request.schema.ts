import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SpeciesRequestStatus } from '@rootshare/shared-types';

export type SpeciesRequestDocument = SpeciesRequest & Document;

@Schema({ timestamps: true })
export class SpeciesRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  scientificName?: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  reason: string;

  @Prop({
    type: String,
    enum: SpeciesRequestStatus,
    default: SpeciesRequestStatus.PENDING,
  })
  status: SpeciesRequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SpeciesRequestSchema = SchemaFactory.createForClass(SpeciesRequest);
