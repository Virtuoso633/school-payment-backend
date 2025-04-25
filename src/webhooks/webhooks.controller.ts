// src/webhooks/webhooks.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks') // Base path usually 'webhooks'
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private readonly webhooksService: WebhooksService) {}

    // POST /webhooks - No JWT Guard here!
    @Post('payment') // Specific path e.g., /webhooks/payment
    @HttpCode(HttpStatus.OK) // Respond 200 OK quickly
    async handlePaymentWebhook(@Body() payload: any) {
        this.logger.log('Payment webhook received.');

        let logEntry;
        try {
            // 1. Log immediately
            logEntry = await this.webhooksService.logWebhook(payload, 'PaymentGateway');
        } catch (error) {
            // If logging fails critically, we might need to return an error status
            // But generally, try to return 200 OK to the gateway if possible
            this.logger.error(`Critical logging failure: ${error.message}`);
            // Decide on response: Maybe return 500, or still 200 if logging isn't mandatory for acknowledgement
            // Let's still return 200 for now to acknowledge receipt to the gateway
            return { message: 'Webhook received but failed to log initially.' };
        }

        // 2. Trigger processing asynchronously (fire-and-forget style for simplicity)
        // Use process.nextTick to defer execution slightly, preventing blocking
        // For production, use a robust queue (e.g., BullMQ, RabbitMQ)
        if (logEntry) {
            process.nextTick(() => {
                this.webhooksService.processPaymentWebhook(logEntry)
                    .catch(error => {
                        // Catch errors from the async processing that weren't caught internally
                        this.logger.error(`Unhandled error during async webhook processing for log ${logEntry._id}: ${error.message}`, error.stack);
                    });
            });
        }

        // 3. Return 200 OK immediately
        return { message: 'Webhook received' };
    }
}