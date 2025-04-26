// src/webhooks/webhooks.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  constructor(private readonly webhooksService: WebhooksService) {}
  
  @Post('payment')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(@Body() payload: any) {
    this.logger.log(`Received payment webhook: ${JSON.stringify(payload)}`);
    
    try {
      // 1. Log the webhook immediately
      const logEntry = await this.webhooksService.logWebhook(payload, 'PaymentGateway');
      
      // 2. Process it asynchronously (don't await)
      process.nextTick(() => {
        this.webhooksService.processPaymentWebhook(logEntry)
          .catch(error => {
            this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
          });
      });
      
      // 3. Return success immediately
      return { message: 'Webhook received' };
    } catch (error) {
      this.logger.error(`Error handling webhook: ${error.message}`, error.stack);
      return { message: 'Webhook received' }; // Still return success to the payment gateway
    }
  }
}