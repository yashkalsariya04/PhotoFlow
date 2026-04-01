import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhotoDocument = Photo & Document;

@Schema({ timestamps: true })
export class Photo {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', index: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop()
  width: number;

  @Prop()
  height: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: [[Number]], default: [] })
  faceEmbeddings: number[][];

  @Prop({ type: [Object], default: [] })
  faceBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
  }>;

  @Prop({ type: Number, default: 0, index: true })
  faceCount: number;

  @Prop({ type: Object })
  pixelFeatures?: {
    colorHistogram: number[];
    edgeFeatures: number[];
    dominantColors: string[];
  };

  @Prop()
  thumbnailFilename: string;

  @Prop()
  createdAt: Date;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);

// Indexes for efficient queries
PhotoSchema.index({ userId: 1, createdAt: -1 });
PhotoSchema.index({ eventId: 1, createdAt: -1 });
// faceCount is already indexed via @Prop({ index: true })
// PhotoSchema.index({ faceCount: 1 });
