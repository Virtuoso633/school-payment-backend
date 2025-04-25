import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OrderDocument } from './schemas/order.schema';
import { OrderStatusDocument } from './schemas/order-status.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class OrdersService {
    private orderModel;
    private orderStatusModel;
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    constructor(orderModel: Model<OrderDocument>, orderStatusModel: Model<OrderStatusDocument>, httpService: HttpService, configService: ConfigService);
    createOrder(createPaymentDto: CreatePaymentDto, userId?: string): Promise<OrderDocument>;
    initiatePayment(order: OrderDocument, callbackUrl: string): Promise<{
        paymentRedirectUrl: string;
        collectRequestId: string;
    }>;
    findAllTransactions(): Promise<never[]>;
    findTransactionsBySchool(schoolId: string): Promise<never[]>;
    findTransactionStatus(orderId: string): Promise<null>;
}
