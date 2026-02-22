import mongoose, { Schema, Document } from "mongoose";

export type PushDeliveryStatus = "sent" | "failed" | "received" | "displayed" | "error";

export interface IPushDeliveryLog extends Document {
    deliveryId: string;
    userId: string;
    type?: string;
    payload: { title: string; body?: string; url?: string };
    endpoint: string;
    subscriptionId?: string;
    status: PushDeliveryStatus;
    errorMessage?: string;
    sentAt: Date;
    receivedAt?: Date;
    displayedAt?: Date;
    errorAt?: Date;
}

const PushDeliveryLogSchema = new Schema(
    {
        deliveryId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        type: { type: String },
        payload: {
            title: { type: String, required: true },
            body: String,
            url: String,
        },
        endpoint: { type: String, required: true },
        subscriptionId: String,
        status: { type: String, enum: ["sent", "failed", "received", "displayed", "error"], required: true, index: true },
        errorMessage: String,
        sentAt: { type: Date, required: true, default: Date.now },
        receivedAt: Date,
        displayedAt: Date,
        errorAt: Date,
    },
    { timestamps: true }
);

PushDeliveryLogSchema.index({ userId: 1, sentAt: -1 });
PushDeliveryLogSchema.index({ deliveryId: 1 });

export default mongoose.models.PushDeliveryLog || mongoose.model<IPushDeliveryLog>("PushDeliveryLog", PushDeliveryLogSchema);
