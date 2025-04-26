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
        this.logger.log(`Creating order for school ${createPaymentDto.school_id} by user ${userId}`);
        try {
            const order = new this.orderModel({
                school_id: createPaymentDto.school_id,
                trustee_id: userId || createPaymentDto.trustee_id,
                student_info: createPaymentDto.student_info,
                amount: createPaymentDto.amount,
                gateway_name: 'Edviron',
            });
            await order.save();
            this.logger.log(`Created new order with ID: ${order._id}`);
            return order;
        }
        catch (error) {
            this.logger.error(`Error creating order: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`Failed to create order: ${error.message}`);
        }
    }
    async initiatePayment(order, callbackUrl) {
        this.logger.log(`Initiating payment request to ${this.configService.get('PAYMENT_API_BASE_URL')}/create-collect-request for order ${order._id}`);
        const payload = {
            school_id: order.school_id,
            amount: order.amount.toString(),
            callback_url: callbackUrl,
        };
        const pgSecretKey = this.configService.get('PAYMENT_PG_SECRET_KEY');
        if (!pgSecretKey) {
            throw new common_1.InternalServerErrorException('Payment gateway secret key not configured');
        }
        const sign = jwt.sign(payload, pgSecretKey);
        const requestBody = {
            ...payload,
            sign,
        };
        this.logger.debug(`Request Body: ${JSON.stringify(requestBody)}`);
        try {
            const { data, status } = await (0, rxjs_1.firstValueFrom)(this.httpService
                .post(`${this.configService.get('PAYMENT_API_BASE_URL')}/create-collect-request`, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.configService.get('PAYMENT_API_KEY')}`,
                },
            })
                .pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`Payment API error: ${error.message}`, error.stack);
                if (error.response) {
                    this.logger.error(`Payment API error response: ${JSON.stringify(error.response.data)}`);
                }
                throw new common_1.InternalServerErrorException('Failed to initiate payment through gateway');
            })));
            this.logger.log(`Payment API Response Status: ${status}`);
            this.logger.debug(`Payment API Response Body: ${JSON.stringify(data)}`);
            if (status === 200 || status === 201) {
                const redirectUrl = data.collect_request_url || data.Collect_request_url || data.redirectURL || data.redirect_url;
                const requestId = data.collect_request_id || data.collectRequestId || data.request_id;
                if (redirectUrl && requestId) {
                    return {
                        paymentRedirectUrl: redirectUrl,
                        collectRequestId: requestId,
                    };
                }
                else {
                    this.logger.error(`Payment API returned incomplete response: ${JSON.stringify(data)}`);
                    throw new common_1.InternalServerErrorException('Payment gateway returned an incomplete response.');
                }
            }
            else {
                this.logger.error(`Payment API returned unexpected status: ${status}`);
                throw new common_1.InternalServerErrorException('Payment gateway returned an unexpected status.');
            }
        }
        catch (error) {
            if (error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Error during payment initiation: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`Error during payment initiation: ${error.message}`);
        }
    }
    async findAllTransactions(paginationQuery) {
        const { limit = 10, page = 1, sort = 'createdAt', order = 'desc' } = paginationQuery;
        const skip = (page - 1) * limit;
        const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
        const sortStage = { $sort: { [sort]: sortOrder, '_id': sortOrder } };
        const pipeline = [
            ...(sort.startsWith('student_info.') || sort === 'createdAt' || sort === 'school_id' ? [sortStage] : []),
            {
                $lookup: {
                    from: this.orderStatusModel.collection.name,
                    localField: '_id',
                    foreignField: 'collect_id',
                    as: 'statusInfo',
                    pipeline: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ]
                },
            },
            {
                $unwind: {
                    path: '$statusInfo',
                    preserveNullAndEmptyArrays: true,
                },
            },
            ...(!sort.startsWith('student_info.') && sort !== 'createdAt' && sort !== 'school_id' ? [sortStage] : []),
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    custom_order_id: '$_id',
                    collect_id: '$statusInfo.collect_id',
                    school_id: '$school_id',
                    gateway: '$gateway_name',
                    order_amount: '$statusInfo.order_amount',
                    transaction_amount: '$statusInfo.transaction_amount',
                    status: '$statusInfo.status',
                    payment_time: '$statusInfo.payment_time',
                    createdAt: '$createdAt',
                },
            },
        ];
        const transactions = await this.orderModel.aggregate(pipeline).exec();
        const countPipeline = [
            ...(sort.startsWith('student_info.') || sort === 'createdAt' || sort === 'school_id' ? [sortStage] : []),
            {
                $lookup: {
                    from: this.orderStatusModel.collection.name,
                    localField: '_id',
                    foreignField: 'collect_id',
                    as: 'statusInfo',
                    pipeline: [{ $limit: 1 }]
                },
            },
            {
                $unwind: {
                    path: '$statusInfo',
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $count: 'total' }
        ];
        const countResult = await this.orderModel.aggregate(countPipeline).exec();
        const total = countResult.length > 0 ? countResult[0].total : 0;
        return { data: transactions, total };
    }
    async findTransactionsBySchool(schoolId, paginationQuery) {
        const { limit = 10, page = 1, sort = 'createdAt', order = 'desc' } = paginationQuery;
        const skip = (page - 1) * limit;
        const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
        const sortStage = { $sort: { [sort]: sortOrder, '_id': sortOrder } };
        const pipeline = [
            { $match: { school_id: schoolId } },
            ...(sort.startsWith('student_info.') || sort === 'createdAt' || sort === 'school_id' ? [sortStage] : []),
            {
                $lookup: {
                    from: this.orderStatusModel.collection.name,
                    localField: '_id', foreignField: 'collect_id', as: 'statusInfo',
                    pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }]
                },
            },
            { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true, }, },
            ...(!sort.startsWith('student_info.') && sort !== 'createdAt' && sort !== 'school_id' ? [sortStage] : []),
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0, custom_order_id: '$_id', collect_id: '$statusInfo.collect_id',
                    school_id: '$school_id', gateway: '$gateway_name',
                    order_amount: '$statusInfo.order_amount', transaction_amount: '$statusInfo.transaction_amount',
                    status: '$statusInfo.status', payment_time: '$statusInfo.payment_time', createdAt: '$createdAt',
                },
            },
        ];
        const transactions = await this.orderModel.aggregate(pipeline).exec();
        const countPipeline = [
            { $match: { school_id: schoolId } },
            { $lookup: { from: this.orderStatusModel.collection.name, localField: '_id', foreignField: 'collect_id', as: 'statusInfo', pipeline: [{ $limit: 1 }] } },
            { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
            { $count: 'total' }
        ];
        const countResult = await this.orderModel.aggregate(countPipeline).exec();
        const total = countResult.length > 0 ? countResult[0].total : 0;
        return { data: transactions, total };
    }
    async findTransactionStatus(customOrderId) {
        if (!mongoose_2.Types.ObjectId.isValid(customOrderId)) {
            throw new common_1.BadRequestException('Invalid custom_order_id format.');
        }
        const orderObjectId = new mongoose_2.Types.ObjectId(customOrderId);
        const status = await this.orderStatusModel
            .findOne({ collect_id: orderObjectId })
            .sort({ createdAt: -1 })
            .exec();
        return status;
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