// src/orders/orders.service.ts
import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose'; // Import PipelineStage
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

import { Order, OrderDocument } from './schemas/order.schema';
import { OrderStatus, OrderStatusDocument } from './schemas/order-status.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto'; // We'll create this DTO

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatus.name) private orderStatusModel: Model<OrderStatusDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // --- Create/Initiate Methods (from previous step) ---
  async createOrder(createPaymentDto: CreatePaymentDto, userId?: string): Promise<OrderDocument> {
    this.logger.log(`Creating order for school ${createPaymentDto.school_id} by user ${userId}`);
    
    try {
      // Create a new Order document
      const order = new this.orderModel({
        school_id: createPaymentDto.school_id,
        trustee_id: userId || createPaymentDto.trustee_id, // Use provided userId or fallback to DTO
        student_info: createPaymentDto.student_info,
        amount: createPaymentDto.amount,
        gateway_name: 'Edviron', // Default gateway name or configurable
      });
      
      // Save to database
      await order.save();
      
      this.logger.log(`Created new order with ID: ${order._id}`);
      return order; // Return the created Order document
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to create order: ${error.message}`);
    }
  }

  
  async initiatePayment(order: OrderDocument, callbackUrl: string): Promise<{ paymentRedirectUrl: string, collectRequestId: string }> {
    this.logger.log(`Initiating payment request to ${this.configService.get('PAYMENT_API_BASE_URL')}/create-collect-request for order ${order._id}`);
  
    // 1. Create JWT payload for payment API
    const payload = {
      school_id: order.school_id,
      amount: order.amount.toString(), // API might expect string
      callback_url: callbackUrl,
    };
  
    // 2. Sign with payment gateway secret key
    const pgSecretKey = this.configService.get<string>('PAYMENT_PG_SECRET_KEY');
    if (!pgSecretKey) {
      throw new InternalServerErrorException('Payment gateway secret key not configured');
    }
    const sign = jwt.sign(payload, pgSecretKey);
  
    // 3. Prepare request body with signature
    const requestBody = {
      ...payload,
      sign,
    };
  
    this.logger.debug(`Request Body: ${JSON.stringify(requestBody)}`);
  
    try {
      // 4. Make API request
      const { data, status } = await firstValueFrom(
        this.httpService
          .post(`${this.configService.get('PAYMENT_API_BASE_URL')}/create-collect-request`, requestBody, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.configService.get('PAYMENT_API_KEY')}`,
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(`Payment API error: ${error.message}`, error.stack);
              if (error.response) {
                this.logger.error(`Payment API error response: ${JSON.stringify(error.response.data)}`);
              }
              throw new InternalServerErrorException('Failed to initiate payment through gateway');
            }),
          ),
      );
  
      // 5. Process response
      this.logger.log(`Payment API Response Status: ${status}`);
      this.logger.debug(`Payment API Response Body: ${JSON.stringify(data)}`);
  
      // 6. Check response status
      if (status === 200 || status === 201) {
        // Extract redirect URL and request ID from response
        const redirectUrl = data.collect_request_url || data.Collect_request_url || data.redirectURL || data.redirect_url;
        const requestId = data.collect_request_id || data.collectRequestId || data.request_id;
  
        if (redirectUrl && requestId) {
          return {
            paymentRedirectUrl: redirectUrl,
            collectRequestId: requestId,
          };
        } else {
          this.logger.error(`Payment API returned incomplete response: ${JSON.stringify(data)}`);
          throw new InternalServerErrorException('Payment gateway returned an incomplete response.');
        }
      } else {
        this.logger.error(`Payment API returned unexpected status: ${status}`);
        throw new InternalServerErrorException('Payment gateway returned an unexpected status.');
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error; // Rethrow if it's already an InternalServerErrorException
      }
      this.logger.error(`Error during payment initiation: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error during payment initiation: ${error.message}`);
    }
  }


  // --- API Endpoint Methods ---

  // 1. Fetch All Transactions (Combined View)
  async findAllTransactions(paginationQuery: PaginationQueryDto): Promise<{ data: any[], total: number }> {
    const { limit = 10, page = 1, sort = 'createdAt', order = 'desc' } = paginationQuery;
    const skip = (page - 1) * limit;

    // Ensure sort order is valid
    const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
    // Define sort stage as explicit PipelineStage
    const sortStage: PipelineStage.Sort = { $sort: { [sort]: sortOrder, '_id': sortOrder } }; // Add secondary sort by _id

    // Aggregation pipeline
    const pipeline: PipelineStage[] = [
      // Stage 1: Sort Orders first if sorting by Order fields (like createdAt)
      ...(sort.startsWith('student_info.') || sort === 'createdAt' || sort === 'school_id' ? [sortStage] : []),

      // Stage 2: Lookup OrderStatus based on Order._id matching OrderStatus.collect_id
      {
        $lookup: {
          from: this.orderStatusModel.collection.name, // Get collection name dynamically
          localField: '_id',
          foreignField: 'collect_id',
          as: 'statusInfo',
          // Optional: Add pipeline within lookup if needed (e.g., get only latest status)
           pipeline: [
             { $sort: { createdAt: -1 } }, // Sort statuses by creation date descending
             { $limit: 1 } // Take only the most recent status entry
           ]
        },
      },
      // Stage 3: Deconstruct the statusInfo array (should have 0 or 1 item due to $limit)
      {
        $unwind: {
          path: '$statusInfo',
          preserveNullAndEmptyArrays: true, // Keep orders even if they have no status yet
        },
      },
      // Stage 4: Sort again if sorting by OrderStatus fields (e.g., payment_time, status)
      ...(!sort.startsWith('student_info.') && sort !== 'createdAt' && sort !== 'school_id' ? [sortStage] : []),

      // Stage 5: Skip and Limit for pagination (applied AFTER potential sorting)
      { $skip: skip },
      { $limit: limit },

      // Stage 6: Project the desired fields (as per assessment spec page 5)
      {
        $project: {
          _id: 0, // Exclude the default _id from the final output
          custom_order_id: '$_id', // Map Order._id to custom_order_id
          collect_id: '$statusInfo.collect_id', // Usually same as custom_order_id
          school_id: '$school_id',
          gateway: '$gateway_name', // Assuming this is set in Order schema? Or use statusInfo.gateway? Clarify origin. Let's use Order.gateway_name
          order_amount: '$statusInfo.order_amount',
          transaction_amount: '$statusInfo.transaction_amount',
          status: '$statusInfo.status',
          // Include other potentially useful fields if needed
           payment_time: '$statusInfo.payment_time',
           createdAt: '$createdAt', // From Order schema timestamps
        },
      },
    ];

    // Execute aggregation for data
    const transactions = await this.orderModel.aggregate(pipeline).exec();

    // Execute aggregation for total count (remove skip, limit, project, second sort stages for count)
    const countPipeline: PipelineStage[] = [
        ...(sort.startsWith('student_info.') || sort === 'createdAt' || sort === 'school_id' ? [sortStage] : []), // Apply initial sort if needed for consistency before lookup? Usually not needed for count.
         {
            $lookup: {
                from: this.orderStatusModel.collection.name,
                localField: '_id',
                foreignField: 'collect_id',
                as: 'statusInfo',
                pipeline: [ { $limit: 1 } ] // Just need to know if status exists
            },
         },
         {
            $unwind: {
                path: '$statusInfo',
                preserveNullAndEmptyArrays: true,
            },
         },
         { $count: 'total' } // Count matching documents
    ];
    const countResult = await this.orderModel.aggregate(countPipeline).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return { data: transactions, total };
  }

  // 2. Fetch Transactions by School (Combined View)
  async findTransactionsBySchool(schoolId: string, paginationQuery: PaginationQueryDto): Promise<{ data: any[], total: number }> {
    const { limit = 10, page = 1, sort = 'createdAt', order = 'desc' } = paginationQuery;
    const skip = (page - 1) * limit;
    const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
    // Define sort stage as explicit PipelineStage
    const sortStage: PipelineStage.Sort = { $sort: { [sort]: sortOrder, '_id': sortOrder } };

    // Base pipeline similar to findAll, but with an initial $match stage
    const pipeline: PipelineStage[] = [
      // Stage 1: Match by school_id FIRST
      { $match: { school_id: schoolId } },

      // Stages 2-7: Same as findAllTransactions (sorting, lookup, unwind, sort, skip, limit, project)
      ...(sort.startsWith('student_info.') || sort === 'createdAt' || sort === 'school_id' ? [sortStage] : []),
      {
        $lookup: {
          from: this.orderStatusModel.collection.name,
          localField: '_id', foreignField: 'collect_id', as: 'statusInfo',
          pipeline: [ { $sort: { createdAt: -1 } }, { $limit: 1 } ]
        },
      },
      { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true, }, },
      ...(!sort.startsWith('student_info.') && sort !== 'createdAt' && sort !== 'school_id' ? [sortStage] : []),
      { $skip: skip},
      { $limit: limit },
      {
        $project: {
          _id: 0, custom_order_id: '$_id', collect_id: '$statusInfo.collect_id',
          school_id: '$school_id', gateway: '$gateway_name', // Assuming Order.gateway_name
          order_amount: '$statusInfo.order_amount', transaction_amount: '$statusInfo.transaction_amount',
          status: '$statusInfo.status', payment_time: '$statusInfo.payment_time', createdAt: '$createdAt',
        },
      },
    ];

    const transactions = await this.orderModel.aggregate(pipeline).exec();

    // Count pipeline with $match
    const countPipeline: PipelineStage[] = [
         { $match: { school_id: schoolId } },
         { $lookup: { from: this.orderStatusModel.collection.name, localField: '_id', foreignField: 'collect_id', as: 'statusInfo', pipeline: [ { $limit: 1 } ] } },
         { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
         { $count: 'total' }
    ];
    const countResult = await this.orderModel.aggregate(countPipeline).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return { data: transactions, total };
  }

  // 3. Check Transaction Status by Custom Order ID (Order._id)
  async findTransactionStatus(customOrderId: string): Promise<OrderStatusDocument | null> {
    // Validate if customOrderId is a valid ObjectId
    if (!Types.ObjectId.isValid(customOrderId)) {
      throw new BadRequestException('Invalid custom_order_id format.');
    }
    const orderObjectId = new Types.ObjectId(customOrderId);

    // Find the LATEST status entry for this order ID
    const status = await this.orderStatusModel
      .findOne({ collect_id: orderObjectId })
      .sort({ createdAt: -1 }) // Get the most recent status update based on creation time
      .exec();

    // If no status found, the transaction might be pending or webhook not received
    // The assessment asks for "current status", so returning null if no status record exists seems appropriate.
    // if (!status) {
    //   throw new NotFoundException(`No status found for transaction with custom_order_id ${customOrderId}`);
    // }

    return status; // Returns the full OrderStatus document or null
  }
}