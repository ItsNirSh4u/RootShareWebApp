import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpeciesDocument = Species & Document;

@Schema({ timestamps: true })
export class Species {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  scientificName?: string;

  @Prop()
  description?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SpeciesSchema = SchemaFactory.createForClass(Species);
