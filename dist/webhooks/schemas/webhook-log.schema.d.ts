import { Document, Schema as MongooseSchema } from 'mongoose';
export type WebhookLogDocument = WebhookLog & Document;
export declare enum ProcessingStatus {
    RECEIVED = "RECEIVED",
    PROCESSING = "PROCESSING",
    PROCESSED = "PROCESSED",
    ERROR = "ERROR"
}
export declare class WebhookLog {
    payload: any;
    received_at: Date;
    processed_at: Date;
    processingStatus: ProcessingStatus;
    errorMessage?: string;
    source?: string;
}
export declare const WebhookLogSchema: MongooseSchema<WebhookLog, import("mongoose").Model<WebhookLog, any, any, any, Document<unknown, any, WebhookLog> & WebhookLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WebhookLog, Document<unknown, {}, import("mongoose").FlatRecord<WebhookLog>> & import("mongoose").FlatRecord<WebhookLog> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
