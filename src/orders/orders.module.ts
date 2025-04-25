// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';
import { Order, OrderSchema } from './schemas/order.schema'; // Import Order schema
import { OrderStatus, OrderStatusSchema } from './schemas/order-status.schema'; // Import OrderStatus schema

@Module({
  imports: [
    MongooseModule.forFeature([ // Register both schemas for this module
      { name: Order.name, schema: OrderSchema },
      { name: OrderStatus.name, schema: OrderStatusSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  // Export service in case other modules (like Webhooks) need it
  exports: [OrdersService]
})
export class OrdersModule {}