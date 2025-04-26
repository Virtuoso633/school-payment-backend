// src/webhooks/webhooks.service.ts
import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebhookLog, WebhookLogDocument, ProcessingStatus } from './schemas/webhook-log.schema';
import { OrderStatus, OrderStatusDocument } from '../orders/schemas/order-status.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema'; // Need Order model to verify collect_id exists

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(WebhookLog.name) private webhookLogModel: Model<WebhookLogDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatus.name) private orderStatusModel: Model<OrderStatusDocument>
  ) {}

  // 1. Log the incoming webhook payload immediately
  async logWebhook(payload: any, source: string): Promise<WebhookLogDocument> {
    this.logger.log(`Received webhook from ${source}`);
    this.logger.debug(`Webhook Payload: ${JSON.stringify(payload)}`); // Log the raw payload

    const logEntry = new this.webhookLogModel({
      payload: payload,
      source: source,
      received_at: new Date(),
      processingStatus: ProcessingStatus.RECEIVED,
    });

    try {
      await logEntry.save();
      this.logger.log(`Webhook payload logged with ID: ${logEntry._id}`);
      return logEntry;
    } catch (error) {
      this.logger.error(`Failed to save webhook log: ${error.message}`, error.stack);
      // Depending on requirements, you might want to throw or just log
      // Throwing here might prevent the webhook source from getting a 200 OK
      // For now, log and potentially return null or handle gracefully
      throw new InternalServerErrorException('Failed to log webhook'); // Or handle differently
    }
  }

  // 2. Process the logged webhook data asynchronously
  async processPaymentWebhook(logEntry: WebhookLogDocument): Promise<void> {
    try {
      this.logger.log(`Processing payment webhook with ID: ${logEntry._id}`);
      
      // 1. Update log status to 'processing'
      logEntry.processingStatus = ProcessingStatus.PROCESSING;
      await logEntry.save();
      
      // 2. Extract order info from payload
      const payload = logEntry.payload;
      if (!payload || !payload.order_info) {
        throw new BadRequestException('Invalid webhook payload format: missing order_info');
      }
      
      const orderInfo = payload.order_info;
      
      // 3. Extract order ID from the order_id field (format: "mongoId/transactionId")
      const orderIdParts = orderInfo.order_id.split('/');
      if (!orderIdParts || orderIdParts.length < 1) {
        throw new BadRequestException(`Invalid order_id format: ${orderInfo.order_id}`);
      }
      
      const collectIdString = orderIdParts[0]; // Extract MongoDB ObjectId part
      
      // 4. Convert to ObjectId
      let collectObjectId;
      try {
        collectObjectId = new Types.ObjectId(collectIdString);
      } catch (error) {
        throw new BadRequestException(`Invalid MongoDB ObjectId: ${collectIdString}`);
      }
      
      this.logger.debug(`Extracted Order ID: ${collectObjectId}`);
      
      // 5. Check if the corresponding Order exists
      const orderExists = await this.orderModel.findById(collectObjectId).exec();
      if (!orderExists) {
        throw new NotFoundException(`Order with collect_id ${collectIdString} not found.`);
      }
      
      // 6. Prepare OrderStatus Data
      const orderStatusData = {
        collect_id: collectObjectId,
        order_amount: orderInfo.order_amount,
        transaction_amount: orderInfo.transaction_amount,
        payment_mode: orderInfo.payment_mode,
        payment_details: orderInfo.payemnt_details, // Note: typo in field name from API
        bank_reference: orderInfo.bank_reference,
        payment_message: orderInfo.Payment_message, // Note: capitalization in field name from API
        status: orderInfo.status, // e.g., "success"
        error_message: orderInfo.error_message === "NA" ? undefined : orderInfo.error_message,
        payment_time: orderInfo.payment_time ? new Date(orderInfo.payment_time) : undefined,
      };
      
      // 7. Create and save OrderStatus
      const orderStatus = new this.orderStatusModel(orderStatusData);
      await orderStatus.save();
      
      this.logger.log(`Created OrderStatus for order ${collectIdString} with status: ${orderInfo.status}`);
      
      // 8. Update webhook log to 'processed'
      logEntry.processingStatus = ProcessingStatus.PROCESSED;
      logEntry.processed_at = new Date();
      await logEntry.save();
      
      this.logger.log(`Webhook processing completed for ID: ${logEntry._id}`);
    } catch (error) {
      // Update log status to 'failed'
      logEntry.processingStatus = ProcessingStatus.ERROR;
      logEntry.errorMessage = error.message;
      await logEntry.save();
      
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw error; // Rethrow for controller to log
    }
  }
}