// src/webhooks/schemas/webhook-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WebhookLogDocument = WebhookLog & Document;

// Define Enum for processing status
export enum ProcessingStatus {
    RECEIVED = 'RECEIVED',
    PROCESSING = 'PROCESSING',
    PROCESSED = 'PROCESSED',
    ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class WebhookLog {
  // Use MongooseSchema.Types.Mixed to allow any JSON structure
  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: any;

  @Prop({ default: Date.now })
  received_at: Date;

  @Prop({ type: Date })
  processed_at: Date;

  // Use the Enum for type safety and restrict values
  @Prop({ type: String, enum: ProcessingStatus, default: ProcessingStatus.RECEIVED, index: true })
  processingStatus: ProcessingStatus;

  @Prop()
  errorMessage?: string; // Optional error message

  @Prop()
  source?: string; // Optional source identifier
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);