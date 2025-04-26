import { OrdersService } from './orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
export declare class OrdersController {
    private readonly ordersService;
    private readonly logger;
    constructor(ordersService: OrdersService);
    createPayment(createPaymentDto: CreatePaymentDto, req: any): Promise<{
        paymentRedirectUrl: string;
        collectRequestId: string;
    }>;
    getAllTransactions(paginationQuery: PaginationQueryDto): Promise<{
        data: any[];
        total: number;
    }>;
    getTransactionsBySchool(schoolId: string, paginationQuery: PaginationQueryDto): Promise<{
        data: any[];
        total: number;
    }>;
    getTransactionStatus(customOrderId: string): Promise<{
        status: string;
        message: string;
        payment_time?: undefined;
        transaction_amount?: undefined;
        payment_mode?: undefined;
        bank_reference?: undefined;
    } | {
        status: string;
        payment_time: Date;
        transaction_amount: number;
        payment_mode: string;
        bank_reference: string;
        message?: undefined;
    }>;
}
