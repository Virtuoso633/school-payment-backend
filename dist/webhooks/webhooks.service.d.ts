import { Model } from 'mongoose';
import { WebhookLogDocument } from './schemas/webhook-log.schema';
import { OrderStatusDocument } from '../orders/schemas/order-status.schema';
import { OrderDocument } from '../orders/schemas/order.schema';
export declare class WebhooksService {
    private webhookLogModel;
    private orderModel;
    private orderStatusModel;
    private readonly logger;
    constructor(webhookLogModel: Model<WebhookLogDocument>, orderModel: Model<OrderDocument>, orderStatusModel: Model<OrderStatusDocument>);
    logWebhook(payload: any, source: string): Promise<WebhookLogDocument>;
    processPaymentWebhook(logEntry: WebhookLogDocument): Promise<void>;
}
