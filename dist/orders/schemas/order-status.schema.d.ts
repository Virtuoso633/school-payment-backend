import { Document, Schema as MongooseSchema } from 'mongoose';
export type OrderStatusDocument = OrderStatus & Document;
export declare class OrderStatus {
    collect_id: MongooseSchema.Types.ObjectId;
    order_amount: number;
    transaction_amount: number;
    payment_mode: string;
    payment_details: string;
    bank_reference: string;
    payment_message: string;
    status: string;
    error_message: string;
    payment_time: Date;
}
export declare const OrderStatusSchema: MongooseSchema<OrderStatus, import("mongoose").Model<OrderStatus, any, any, any, Document<unknown, any, OrderStatus> & OrderStatus & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OrderStatus, Document<unknown, {}, import("mongoose").FlatRecord<OrderStatus>> & import("mongoose").FlatRecord<OrderStatus> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
