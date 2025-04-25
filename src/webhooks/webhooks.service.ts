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
      receivedAt: new Date(),
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
    this.logger.log(`Processing webhook log ID: ${logEntry._id}`);
    const payload = logEntry.payload;

    try {
      // --- Validate Payload Structure ---
      if (!payload || !payload.order_info || !payload.order_info.order_id || typeof payload.status !== 'number') {
        throw new BadRequestException('Invalid webhook payload structure');
      }
      if(payload.status !== 200) {
         throw new BadRequestException(`Webhook status indicates failure or non-standard response: ${payload.status}`);
      }

      const orderInfo = payload.order_info;
      const orderIdParts = orderInfo.order_id.split('/'); // Format: "collect_id/transaction_id"

      if (orderIdParts.length < 1) { // Allow for possibility of only collect_id? Check API behavior. Assume at least collect_id.
        throw new BadRequestException('Invalid order_id format in webhook payload');
      }

      const collectIdString = orderIdParts[0];
      // const transactionId = orderIdParts[1]; // Might be useful

      // Validate if collectIdString is a valid MongoDB ObjectId
      if (!Types.ObjectId.isValid(collectIdString)) {
         throw new BadRequestException(`Invalid collect_id format: ${collectIdString}`);
      }
      const collectObjectId = new Types.ObjectId(collectIdString);

      // --- Check if the corresponding Order exists ---
      const orderExists = await this.orderModel.findById(collectObjectId).exec();
      if (!orderExists) {
          throw new NotFoundException(`Order with collect_id ${collectIdString} not found.`);
      }

      // --- Prepare OrderStatus Data ---
      // Map webhook payload fields to OrderStatus schema fields
      const orderStatusData: Partial<OrderStatus> = {
        collect_id: collectObjectId as unknown as any, // Link to the Order document
        order_amount: orderInfo.order_amount,
        transaction_amount: orderInfo.transaction_amount,
        payment_mode: orderInfo.payment_mode,
        payment_details: orderInfo.payemnt_details, // Typo in assessment spec? Assuming payemnt_details
        bank_reference: orderInfo.bank_reference,
        payment_message: orderInfo.Payment_message, // Typo in assessment spec? Assuming Payment_message
        status: orderInfo.status, // e.g., "success"
        error_message: orderInfo.error_message === "NA" ? undefined : orderInfo.error_message, // Handle "NA"
        payment_time: orderInfo.payment_time ? new Date(orderInfo.payment_time) : undefined,
      };

      // --- Update/Create OrderStatus ---
      // Use updateOne with upsert: If status for this order doesn't exist, create it.
      // If it exists, update it (might be risky if multiple updates arrive).
      // A safer approach might be to always create a new status entry if status changes.
      // Let's use findOneAndUpdate with upsert for simplicity based on spec.
      // We match on collect_id. If multiple statuses are possible per order, rethink this.
      // Assuming one final status per order for now.
      const updatedStatus = await this.orderStatusModel.findOneAndUpdate(
        { collect_id: collectObjectId }, // Find based on the Order reference
        { $set: orderStatusData }, // Set the new data
        { new: true, upsert: true, runValidators: true } // Options: return updated, create if not found, run schema validation
      ).exec();

      this.logger.log(`Order status updated/created for collect_id ${collectIdString}. New status: ${updatedStatus.status}`);

      // --- Update Log Entry Status ---
      logEntry.processingStatus = ProcessingStatus.PROCESSED;
      logEntry.errorMessage = undefined;

    } catch (error) {
      this.logger.error(`Error processing webhook log ${logEntry._id}: ${error.message}`, error.stack);
      logEntry.processingStatus = ProcessingStatus.ERROR;
      logEntry.errorMessage = error.message;
      // Decide if you need to re-throw or handle specific errors differently
    } finally {
      // Always save the updated log entry status
      try {
        await logEntry.save();
      } catch (saveError) {
        this.logger.error(`Failed to update webhook log status for ${logEntry._id}: ${saveError.message}`, saveError.stack);
      }
    }
  }
}