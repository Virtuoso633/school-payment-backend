// src/orders/orders.controller.ts
import {
    Controller, Post, Body, UseGuards, Request, Logger,
    Get, Query, Param, NotFoundException, // Import GET, Query, Param, NotFoundException
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { CreatePaymentDto } from './dto/create-payment.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { OrderDocument } from './schemas/order.schema';
  import { PaginationQueryDto } from '../common/dto/pagination-query.dto'; // Import pagination DTO
  
  @UseGuards(JwtAuthGuard) // Apply guard to the whole controller
  @Controller('orders')
  export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);
  
    constructor(private readonly ordersService: OrdersService) {}
  
    @Post('create-payment')
    async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
      this.logger.log(`Received create-payment request for school ${createPaymentDto.school_id} by user ${req.user.userId}`);
      this.logger.debug(`Payload: ${JSON.stringify(createPaymentDto)}`);
  
      // Extract user ID from the JWT payload attached by JwtAuthGuard/JwtStrategy
      const userId = req.user.userId;
  
      // 1. Create an Order record in your database
      const order = await this.ordersService.createOrder(createPaymentDto, userId);
  
      // 2. Call the service to interact with the payment gateway
      const paymentInitiationResult = await this.ordersService.initiatePayment(
          order,
          createPaymentDto.callback_url
      );
  
      this.logger.log(`Payment initiated for order ${order._id}. Redirect URL provided.`);
  
      // 3. Return the necessary info (e.g., redirect URL) to the frontend
      return paymentInitiationResult; // Contains { paymentRedirectUrl, collectRequestId }
    }
  
    // --- New GET Endpoints ---
  
    // GET /orders/transactions
    @Get('transactions')
    async getAllTransactions(@Query() paginationQuery: PaginationQueryDto) {
      this.logger.log(`Fetching all transactions with query: ${JSON.stringify(paginationQuery)}`);
      return this.ordersService.findAllTransactions(paginationQuery);
    }
  
    // GET /orders/transactions/school/:schoolId
    @Get('transactions/school/:schoolId')
    async getTransactionsBySchool(
      @Param('schoolId') schoolId: string,
      @Query() paginationQuery: PaginationQueryDto
    ) {
      this.logger.log(`Fetching transactions for school ${schoolId} with query: ${JSON.stringify(paginationQuery)}`);
      // Add validation for schoolId if needed (e.g., IsMongoId pipe if it's an ObjectId)
      return this.ordersService.findTransactionsBySchool(schoolId, paginationQuery);
    }
  
    // GET /orders/transaction-status/:custom_order_id
    @Get('transaction-status/:custom_order_id')
    async getTransactionStatus(@Param('custom_order_id') customOrderId: string) {
      this.logger.log(`Fetching status for transaction ${customOrderId}`);
      const status = await this.ordersService.findTransactionStatus(customOrderId);
      if (!status) {
        // Return a meaningful response if status is not found, e.g., Pending or Not Found
        // throw new NotFoundException(`Status not found for transaction ${customOrderId}`);
         return { status: 'PENDING', message: 'Transaction status not found or pending.' }; // Or return 404
      }
      // Return relevant fields from the status object
      return {
          status: status.status,
          payment_time: status.payment_time,
          transaction_amount: status.transaction_amount,
          payment_mode: status.payment_mode,
          bank_reference: status.bank_reference,
          // ... add other fields as needed by the frontend
      };
    }
  }