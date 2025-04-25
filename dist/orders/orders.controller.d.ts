import { OrdersService } from './orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class OrdersController {
    private readonly ordersService;
    private readonly logger;
    constructor(ordersService: OrdersService);
    createPayment(createPaymentDto: CreatePaymentDto, req: any): Promise<{
        paymentRedirectUrl: string;
        collectRequestId: string;
    }>;
}
