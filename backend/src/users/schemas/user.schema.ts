import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  createdAt: Date;

  @Prop()
  avatarFilename?: string;

  @Prop()
  designation?: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  location?: string;

  @Prop({ type: [Number] })
  faceEmbedding?: number[];
}

export const UserSchema = SchemaFactory.createForClass(User);
