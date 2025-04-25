// src/webhooks/webhooks.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksService } from '../webhooks.service';
import { WebhookLog, WebhookLogSchema } from './schemas/webhook-log.schema'; // Import schema
import { OrdersModule } from '../orders/orders.module'; // Import OrdersModule to use OrdersService/Models

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WebhookLog.name, schema: WebhookLogSchema }]), // Register schema
    OrdersModule, // Import OrdersModule here
  ],
  providers: [WebhooksService],
  // Export WebhooksService if needed by controllers (e.g., a webhook controller)
  exports: [WebhooksService]
})
export class WebhooksModule {}