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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const jwt = require("jsonwebtoken");
const order_schema_1 = require("./schemas/order.schema");
const order_status_schema_1 = require("./schemas/order-status.schema");
let OrdersService = OrdersService_1 = class OrdersService {
    orderModel;
    orderStatusModel;
    httpService;
    configService;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(orderModel, orderStatusModel, httpService, configService) {
        this.orderModel = orderModel;
        this.orderStatusModel = orderStatusModel;
        this.httpService = httpService;
        this.configService = configService;
    }
    async createOrder(createPaymentDto, userId) {
        const orderData = {
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
    async initiatePayment(order, callbackUrl) {
        const paymentApiBaseUrl = this.configService.get('PAYMENT_API_BASE_URL');
        const paymentApiKey = this.configService.get('PAYMENT_API_KEY');
        const pgSecretKey = this.configService.get('PAYMENT_PG_SECRET_KEY') || this.configService.get('PAYMENT_PG_KEY');
        const signPayload = {
            school_id: order.school_id,
            amount: order.amount.toString(),
            callback_url: callbackUrl,
        };
        if (!pgSecretKey) {
            this.logger.error('Payment gateway signing key is not configured.');
            throw new common_1.InternalServerErrorException('Payment gateway signing key is not configured.');
        }
        let signedJwt;
        try {
            signedJwt = jwt.sign(signPayload, pgSecretKey, { algorithm: 'HS256' });
        }
        catch (error) {
            this.logger.error(`Failed to sign JWT payload: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to prepare payment request.');
        }
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
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(apiUrl, apiRequestBody, { headers }).pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`Payment API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`, error.stack);
                throw new common_1.InternalServerErrorException('Payment gateway request failed.');
            })));
            this.logger.log(`Payment API Response Status: ${response.status}`);
            this.logger.debug(`Payment API Response Body: ${JSON.stringify(response.data)}`);
            const responseData = response.data;
            if (response.status === 200 || response.status === 201) {
                const redirectUrl = responseData.collect_request_url || responseData.Collect_request_url || responseData.redirectURL || responseData.redirect_url;
                const requestId = responseData.collect_request_id || responseData.collectRequestId || responseData.request_id;
                if (redirectUrl && requestId) {
                    return {
                        paymentRedirectUrl: redirectUrl,
                        collectRequestId: requestId
                    };
                }
                else {
                    this.logger.error(`Payment API returned incomplete response: ${JSON.stringify(responseData)}`);
                    throw new common_1.InternalServerErrorException('Payment gateway returned an incomplete response.');
                }
            }
            else {
                this.logger.error(`Payment API returned unexpected status: ${response.status}`);
                throw new common_1.InternalServerErrorException('Payment gateway returned an unexpected status.');
            }
        }
        catch (error) {
            this.logger.error(`Error during payment initiation: ${error.message}`);
            throw error;
        }
    }
    async findAllTransactions() {
        return [];
    }
    async findTransactionsBySchool(schoolId) {
        return [];
    }
    async findTransactionStatus(orderId) {
        return null;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_status_schema_1.OrderStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        axios_1.HttpService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map