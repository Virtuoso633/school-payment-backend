// src/orders/orders.controller.ts
import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Import the guard
import { OrderDocument } from './schemas/order.schema'; // Import the OrderDocument type

@Controller('orders') // Base path usually 'orders' or 'payments'
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard) // Protect this route
  @Post('create-payment') // Route: POST /orders/create-payment
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    this.logger.log(`Received create-payment request for school ${createPaymentDto.school_id} by user ${req.user.userId}`);
    this.logger.debug(`Payload: ${JSON.stringify(createPaymentDto)}`);

    // Extract user ID from the JWT payload attached by JwtAuthGuard/JwtStrategy
    const userId = req.user.userId;

    // 1. Create an Order record in your database
    // Pass amount from DTO to service if Order schema doesn't store it directly
    const order = await this.ordersService.createOrder(createPaymentDto, userId);

    // Add amount to the order object before passing to initiatePayment if needed
    // This assumes the Order schema itself doesn't have amount, but payment API needs it.
    // A bit awkward - consider adding amount to Order schema if frequently needed.
    // const orderWithAmount = { ...order.toObject(), amount: createPaymentDto.amount };


    // // 2. Call the service to interact with the payment gateway
    // const paymentInitiationResult = await this.ordersService.initiatePayment(
    //     orderWithAmount as OrderDocument, // Cast needed if we added amount manually
    //     createPaymentDto.callback_url
    // );

    // To this:
    const paymentInitiationResult = await this.ordersService.initiatePayment(
        order,
        createPaymentDto.callback_url
    );

    this.logger.log(`Payment initiated for order ${order._id}. Redirect URL provided.`);

    // 3. Return the necessary info (e.g., redirect URL) to the frontend
    return paymentInitiationResult; // Contains { paymentRedirectUrl, collectRequestId }
  }

  // Placeholder for GET endpoints needed later
  // @Get('transactions') ...
  // @Get('transactions/school/:schoolId') ...
  // @Get('transaction-status/:custom_order_id') ...
}