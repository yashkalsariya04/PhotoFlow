import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedLinkDocument = SharedLink & Document;

@Schema({ timestamps: true })
export class SharedLink {
  @Prop({ required: true, enum: ['photo', 'album'] })
  resourceType: 'photo' | 'album';

  @Prop({ type: Types.ObjectId, required: true, index: true })
  resourceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop()
  expiresAt: Date;

  @Prop()
  createdAt: Date;
}

export const SharedLinkSchema = SchemaFactory.createForClass(SharedLink);

// Indexes for efficient queries
SharedLinkSchema.index({ resourceType: 1, resourceId: 1 });
