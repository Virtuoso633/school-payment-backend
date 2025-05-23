"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const webhook_log_schema_1 = require("./schemas/webhook-log.schema");
const order_status_schema_1 = require("../orders/schemas/order-status.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    webhookLogModel;
    orderModel;
    orderStatusModel;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(webhookLogModel, orderModel, orderStatusModel) {
        this.webhookLogModel = webhookLogModel;
        this.orderModel = orderModel;
        this.orderStatusModel = orderStatusModel;
    }
    async logWebhook(payload, source) {
        this.logger.log(`Received webhook from ${source}`);
        this.logger.debug(`Webhook Payload: ${JSON.stringify(payload)}`);
        const logEntry = new this.webhookLogModel({
            payload: payload,
            source: source,
            received_at: new Date(),
            processingStatus: webhook_log_schema_1.ProcessingStatus.RECEIVED,
        });
        try {
            await logEntry.save();
            this.logger.log(`Webhook payload logged with ID: ${logEntry._id}`);
            return logEntry;
        }
        catch (error) {
            this.logger.error(`Failed to save webhook log: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to log webhook');
        }
    }
    async processPaymentWebhook(logEntry) {
        try {
            this.logger.log(`Processing payment webhook with ID: ${logEntry._id}`);
            logEntry.processingStatus = webhook_log_schema_1.ProcessingStatus.PROCESSING;
            await logEntry.save();
            const payload = logEntry.payload;
            if (!payload || !payload.order_info) {
                throw new common_1.BadRequestException('Invalid webhook payload format: missing order_info');
            }
            const orderInfo = payload.order_info;
            const orderIdParts = orderInfo.order_id.split('/');
            if (!orderIdParts || orderIdParts.length < 1) {
                throw new common_1.BadRequestException(`Invalid order_id format: ${orderInfo.order_id}`);
            }
            const collectIdString = orderIdParts[0];
            let collectObjectId;
            try {
                collectObjectId = new mongoose_2.Types.ObjectId(collectIdString);
            }
            catch (error) {
                throw new common_1.BadRequestException(`Invalid MongoDB ObjectId: ${collectIdString}`);
            }
            this.logger.debug(`Extracted Order ID: ${collectObjectId}`);
            const orderExists = await this.orderModel.findById(collectObjectId).exec();
            if (!orderExists) {
                throw new common_1.NotFoundException(`Order with collect_id ${collectIdString} not found.`);
            }
            const orderStatusData = {
                collect_id: collectObjectId,
                order_amount: orderInfo.order_amount,
                transaction_amount: orderInfo.transaction_amount,
                payment_mode: orderInfo.payment_mode,
                payment_details: orderInfo.payment_details,
                bank_reference: orderInfo.bank_reference,
                payment_message: orderInfo.payment_message,
                status: orderInfo.status,
                error_message: orderInfo.error_message === "NA" ? undefined : orderInfo.error_message,
                payment_time: orderInfo.payment_time ? new Date(orderInfo.payment_time) : undefined,
            };
            const orderStatus = new this.orderStatusModel(orderStatusData);
            await orderStatus.save();
            this.logger.log(`Created OrderStatus for order ${collectIdString} with status: ${orderInfo.status}`);
            logEntry.processingStatus = webhook_log_schema_1.ProcessingStatus.PROCESSED;
            logEntry.processed_at = new Date();
            await logEntry.save();
            this.logger.log(`Webhook processing completed for ID: ${logEntry._id}`);
        }
        catch (error) {
            logEntry.processingStatus = webhook_log_schema_1.ProcessingStatus.ERROR;
            logEntry.errorMessage = error.message;
            await logEntry.save();
            this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(webhook_log_schema_1.WebhookLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(2, (0, mongoose_1.InjectModel)(order_status_schema_1.OrderStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map