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
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    webhooksService;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    async handlePaymentWebhook(payload) {
        this.logger.log('Payment webhook received.');
        let logEntry;
        try {
            logEntry = await this.webhooksService.logWebhook(payload, 'PaymentGateway');
        }
        catch (error) {
            this.logger.error(`Critical logging failure: ${error.message}`);
            return { message: 'Webhook received but failed to log initially.' };
        }
        if (logEntry) {
            process.nextTick(() => {
                this.webhooksService.processPaymentWebhook(logEntry)
                    .catch(error => {
                    this.logger.error(`Unhandled error during async webhook processing for log ${logEntry._id}: ${error.message}`, error.stack);
                });
            });
        }
        return { message: 'Webhook received' };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('payment'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handlePaymentWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map