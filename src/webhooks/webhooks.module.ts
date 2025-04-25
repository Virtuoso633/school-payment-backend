import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookLog, WebhookLogSchema } from './schemas/webhook-log.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { OrderStatus, OrderStatusSchema } from '../orders/schemas/order-status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookLog.name, schema: WebhookLogSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderStatus.name, schema: OrderStatusSchema },
    ]),
    // Note: You may not need to import OrdersModule if you're directly importing the models
    // OrdersModule might be causing circular dependency issues
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}