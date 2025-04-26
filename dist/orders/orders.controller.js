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
var OrdersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
let OrdersController = OrdersController_1 = class OrdersController {
    ordersService;
    logger = new common_1.Logger(OrdersController_1.name);
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async createPayment(createPaymentDto, req) {
        this.logger.log(`Received create-payment request for school ${createPaymentDto.school_id} by user ${req.user.userId}`);
        this.logger.debug(`Payload: ${JSON.stringify(createPaymentDto)}`);
        const userId = req.user.userId;
        const order = await this.ordersService.createOrder(createPaymentDto, userId);
        const paymentInitiationResult = await this.ordersService.initiatePayment(order, createPaymentDto.callback_url);
        this.logger.log(`Payment initiated for order ${order._id}. Redirect URL provided.`);
        return paymentInitiationResult;
    }
    async getAllTransactions(paginationQuery) {
        this.logger.log(`Fetching all transactions with query: ${JSON.stringify(paginationQuery)}`);
        return this.ordersService.findAllTransactions(paginationQuery);
    }
    async getTransactionsBySchool(schoolId, paginationQuery) {
        this.logger.log(`Fetching transactions for school ${schoolId} with query: ${JSON.stringify(paginationQuery)}`);
        return this.ordersService.findTransactionsBySchool(schoolId, paginationQuery);
    }
    async getTransactionStatus(customOrderId) {
        this.logger.log(`Fetching status for transaction ${customOrderId}`);
        const status = await this.ordersService.findTransactionStatus(customOrderId);
        if (!status) {
            return { status: 'PENDING', message: 'Transaction status not found or pending.' };
        }
        return {
            status: status.status,
            payment_time: status.payment_time,
            transaction_amount: status.transaction_amount,
            payment_mode: status.payment_mode,
            bank_reference: status.bank_reference,
        };
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('create-payment'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/school/:schoolId'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getTransactionsBySchool", null);
__decorate([
    (0, common_1.Get)('transaction-status/:custom_order_id'),
    __param(0, (0, common_1.Param)('custom_order_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getTransactionStatus", null);
exports.OrdersController = OrdersController = OrdersController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map