import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientAccessDocument = ClientAccess & Document;

@Schema({ timestamps: true })
export class ClientAccess {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  clientName: string;

  @Prop()
  clientEmail: string;

  @Prop()

  clientPhone: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Photo' }], default: [] })
  matchedPhotoIds: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  matchedPhotoCount: number;

  @Prop()
  lastAccessedAt: Date;

  @Prop()
  createdAt: Date;
}

export const ClientAccessSchema = SchemaFactory.createForClass(ClientAccess);

ClientAccessSchema.index({ eventId: 1, createdAt: -1 });
