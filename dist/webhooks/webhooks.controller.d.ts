import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly logger;
    constructor(webhooksService: WebhooksService);
    handlePaymentWebhook(payload: any): Promise<{
        message: string;
    }>;
}
