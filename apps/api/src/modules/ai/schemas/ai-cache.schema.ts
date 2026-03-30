import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AiCacheDocument = HydratedDocument<AiCache>;

@Schema()
export class AiCache {
  @Prop({ required: true, index: true, unique: true })
  key: string;

  @Prop({ required: true })
  response: string;

  @Prop({ default: Date.now, expires: '7d' })
  createdAt: Date;
}

export const AiCacheSchema = SchemaFactory.createForClass(AiCache);
