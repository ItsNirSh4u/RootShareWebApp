import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlantStatus } from '@rootshare/shared-types';

export type PlantDocument = Plant & Document;

@Schema({ timestamps: true })
export class Plant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  species: string;

  @Prop({ type: String, enum: PlantStatus, default: PlantStatus.ACTIVE })
  status: PlantStatus;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PlantSchema = SchemaFactory.createForClass(Plant);
