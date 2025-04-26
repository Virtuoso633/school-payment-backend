import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OrderDocument } from './schemas/order.schema';
import { OrderStatusDocument } from './schemas/order-status.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
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
    findAllTransactions(paginationQuery: PaginationQueryDto): Promise<{
        data: any[];
        total: number;
    }>;
    findTransactionsBySchool(schoolId: string, paginationQuery: PaginationQueryDto): Promise<{
        data: any[];
        total: number;
    }>;
    findTransactionStatus(customOrderId: string): Promise<OrderStatusDocument | null>;
}
