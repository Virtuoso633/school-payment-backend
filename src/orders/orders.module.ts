// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema'; // Import Order schema
import { OrderStatus, OrderStatusSchema } from './schemas/order-status.schema'; // Import OrderStatus schema
import { AuthModule } from '../auth/auth.module'; // Import AuthModule


@Module({
  imports: [
    MongooseModule.forFeature([ // Register both schemas for this module
      { name: Order.name, schema: OrderSchema },
      { name: OrderStatus.name, schema: OrderStatusSchema },
    ]),
    HttpModule, // Add HttpModule here
    AuthModule, // Add AuthModule to access Passport/JWT features if needed
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  // Export service in case other modules (like Webhooks) need it
  exports: [OrdersService]
})
export class OrdersModule {}