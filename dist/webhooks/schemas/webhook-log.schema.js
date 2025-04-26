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
exports.WebhookLogSchema = exports.WebhookLog = exports.ProcessingStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["RECEIVED"] = "RECEIVED";
    ProcessingStatus["PROCESSING"] = "PROCESSING";
    ProcessingStatus["PROCESSED"] = "PROCESSED";
    ProcessingStatus["ERROR"] = "ERROR";
})(ProcessingStatus || (exports.ProcessingStatus = ProcessingStatus = {}));
let WebhookLog = class WebhookLog {
    payload;
    received_at;
    processed_at;
    processingStatus;
    errorMessage;
    source;
};
exports.WebhookLog = WebhookLog;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], WebhookLog.prototype, "payload", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], WebhookLog.prototype, "received_at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], WebhookLog.prototype, "processed_at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ProcessingStatus, default: ProcessingStatus.RECEIVED, index: true }),
    __metadata("design:type", String)
], WebhookLog.prototype, "processingStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WebhookLog.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WebhookLog.prototype, "source", void 0);
exports.WebhookLog = WebhookLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WebhookLog);
exports.WebhookLogSchema = mongoose_1.SchemaFactory.createForClass(WebhookLog);
//# sourceMappingURL=webhook-log.schema.js.map