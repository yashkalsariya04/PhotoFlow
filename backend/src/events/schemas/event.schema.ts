import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  photographerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  eventDate: Date;

  @Prop({ required: true, unique: true })
  accessCode: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  photoCount: number;

  @Prop({ type: Number, default: 0 })
  clientAccessCount: number;

  @Prop()
  coverPhotoId: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ photographerId: 1, createdAt: -1 });
