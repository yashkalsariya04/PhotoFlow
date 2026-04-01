import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlbumDocument = Album & Document;

@Schema({ timestamps: true })
export class Album {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  isSmart: boolean;

  @Prop({ type: [String], default: [] })
  tagRules: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Photo' }], default: [] })
  photoIds: Types.ObjectId[];

  @Prop()
  createdAt: Date;
}

export const AlbumSchema = SchemaFactory.createForClass(Album);

// Indexes for efficient queries
AlbumSchema.index({ userId: 1, createdAt: -1 });
