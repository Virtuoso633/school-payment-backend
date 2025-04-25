// src/orders/orders.service.ts
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

import { Order, OrderDocument } from './schemas/order.schema';
import { OrderStatus, OrderStatusDocument } from './schemas/order-status.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatus.name) private orderStatusModel: Model<OrderStatusDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Step 1: Create the initial order record in our DB
  async createOrder(createPaymentDto: CreatePaymentDto, userId?: string): Promise<OrderDocument> {
    const orderData: Partial<Order> = {
      school_id: createPaymentDto.school_id,
      trustee_id: createPaymentDto.trustee_id || userId,
      student_info: createPaymentDto.student_info,
      amount: createPaymentDto.amount,
    };

    const newOrder = new this.orderModel(orderData);
    await newOrder.save();
    this.logger.log(`Created new order with ID: ${newOrder._id}`);
    return newOrder;
  }

  // Step 2: Prepare and call the external payment gateway API
  async initiatePayment(order: OrderDocument, callbackUrl: string): Promise<{ paymentRedirectUrl: string, collectRequestId: string }> {
    const paymentApiBaseUrl = this.configService.get<string>('PAYMENT_API_BASE_URL');
    const paymentApiKey = this.configService.get<string>('PAYMENT_API_KEY');
    const pgSecretKey = this.configService.get<string>('PAYMENT_PG_SECRET_KEY') || this.configService.get<string>('PAYMENT_PG_KEY');

    // --- Payload for JWT Signing ---
    const signPayload = {
      school_id: order.school_id,
      amount: order.amount.toString(),
      callback_url: callbackUrl,
    };

    // --- Sign the JWT ---
    if (!pgSecretKey) {
      this.logger.error('Payment gateway signing key is not configured.');
      throw new InternalServerErrorException('Payment gateway signing key is not configured.');
    }
    
    let signedJwt: string;
    try {
      // Try with explicit algorithm specification
      signedJwt = jwt.sign(signPayload, pgSecretKey, { algorithm: 'HS256' });
    } catch (error) {
      this.logger.error(`Failed to sign JWT payload: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to prepare payment request.');
    }

    // --- Payload for the API Request ---
    const apiRequestBody = {
      school_id: signPayload.school_id,
      amount: signPayload.amount,
      callback_url: signPayload.callback_url,
      sign: signedJwt,
    };

    const apiUrl = `${paymentApiBaseUrl}/create-collect-request`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${paymentApiKey}`,
    };

    this.logger.log(`Initiating payment request to ${apiUrl} for order ${order._id}`);
    this.logger.debug(`Request Body: ${JSON.stringify(apiRequestBody)}`);

    // --- Make the API Call ---
    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, apiRequestBody, { headers }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Payment API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`, error.stack);
            throw new InternalServerErrorException('Payment gateway request failed.');
          }),
        ),
      );

      this.logger.log(`Payment API Response Status: ${response.status}`);
      this.logger.debug(`Payment API Response Body: ${JSON.stringify(response.data)}`);

      // --- Process Response ---
      const responseData = response.data;
      if (response.status === 200 || response.status === 201) {
        const redirectUrl = responseData.collect_request_url || responseData.Collect_request_url || responseData.redirectURL || responseData.redirect_url;
        const requestId = responseData.collect_request_id || responseData.collectRequestId || responseData.request_id;
  
        if (redirectUrl && requestId) {
          return {
            paymentRedirectUrl: redirectUrl,
            collectRequestId: requestId
          };
        } else {
          this.logger.error(`Payment API returned incomplete response: ${JSON.stringify(responseData)}`);
          throw new InternalServerErrorException('Payment gateway returned an incomplete response.');
        }
      } else {
        this.logger.error(`Payment API returned unexpected status: ${response.status}`);
        throw new InternalServerErrorException('Payment gateway returned an unexpected status.');
      }
    } catch (error) {
      this.logger.error(`Error during payment initiation: ${error.message}`);
      throw error;
    }
  }

  // Placeholder for methods needed later
  async findAllTransactions() { 
    return []; // Implementation later
  }
  
  async findTransactionsBySchool(schoolId: string) { 
    return []; // Implementation later
  }
  
  async findTransactionStatus(orderId: string) { 
    return null; // Implementation later
  }
}