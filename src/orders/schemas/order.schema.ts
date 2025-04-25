// src/orders/schemas/order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
// Import StudentInfoDto if you want strict typing, but Mongoose uses the inline class below
// import { StudentInfoDto } from '../dto/student-info.dto';

export type OrderDocument = Order & Document;

// Define schema for the nested student_info object directly
@Schema({ _id: false }) // No separate _id for this sub-document
class StudentInfo {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  email: string;
}
const StudentInfoSchema = SchemaFactory.createForClass(StudentInfo);


@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  school_id: string;

  @Prop({ required: true })
  trustee_id: string;

  @Prop({ required: true, type: StudentInfoSchema }) // Use the sub-schema type
  student_info: StudentInfo; // Type is the class defined above

  @Prop()
  gateway_name?: string; // Optional field

  // Mongoose automatically adds _id: ObjectId

  @Prop({ required: true, type: Number }) // Add this line
  amount: number; // Add this property
}

export const OrderSchema = SchemaFactory.createForClass(Order);