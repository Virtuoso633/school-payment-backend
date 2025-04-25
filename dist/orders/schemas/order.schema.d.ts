import { Document, Schema as MongooseSchema } from 'mongoose';
export type OrderDocument = Order & Document;
declare class StudentInfo {
    name: string;
    id: string;
    email: string;
}
export declare class Order {
    school_id: string;
    trustee_id: string;
    student_info: StudentInfo;
    gateway_name?: string;
    amount: number;
}
export declare const OrderSchema: MongooseSchema<Order, import("mongoose").Model<Order, any, any, any, Document<unknown, any, Order> & Order & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, import("mongoose").FlatRecord<Order>> & import("mongoose").FlatRecord<Order> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export {};
