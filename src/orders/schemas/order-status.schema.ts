// src/orders/schemas/order-status.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Order } from './order.schema'; // Import Order for reference typing

export type OrderStatusDocument = OrderStatus & Document;

@Schema({ timestamps: true })
export class OrderStatus {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true, index: true })
  collect_id: MongooseSchema.Types.ObjectId; // Reference to Order._id

  @Prop({ type: Number }) // Mongoose type is Number
  order_amount: number; // TS type is number

  @Prop({ type: Number })
  transaction_amount: number;

  @Prop()
  payment_mode: string;

  @Prop()
  payment_details: string;

  @Prop()
  bank_reference: string;

  @Prop()
  payment_message: string;

  @Prop({ required: true, index: true })
  status: string; // e.g., 'SUCCESS', 'PENDING', 'FAILED'

  @Prop()
  error_message: string;

  @Prop({ type: Date, index: true })
  payment_time: Date;
}

export const OrderStatusSchema = SchemaFactory.createForClass(OrderStatus);