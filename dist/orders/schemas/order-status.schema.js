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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatusSchema = exports.OrderStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let OrderStatus = class OrderStatus {
    collect_id;
    order_amount;
    transaction_amount;
    payment_mode;
    payment_details;
    bank_reference;
    payment_message;
    status;
    error_message;
    payment_time;
};
exports.OrderStatus = OrderStatus;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Order', required: true, index: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], OrderStatus.prototype, "collect_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], OrderStatus.prototype, "order_amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], OrderStatus.prototype, "transaction_amount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderStatus.prototype, "payment_mode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderStatus.prototype, "payment_details", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderStatus.prototype, "bank_reference", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderStatus.prototype, "payment_message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], OrderStatus.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderStatus.prototype, "error_message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, index: true }),
    __metadata("design:type", Date)
], OrderStatus.prototype, "payment_time", void 0);
exports.OrderStatus = OrderStatus = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], OrderStatus);
exports.OrderStatusSchema = mongoose_1.SchemaFactory.createForClass(OrderStatus);
//# sourceMappingURL=order-status.schema.js.map