import mongoose, { Schema, Document } from "mongoose";

export interface IPushSubscription extends Document {
    userId: mongoose.Types.ObjectId;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        endpoint: { type: String, required: true, unique: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
        },
        userAgent: String,
    },
    { timestamps: true }
);

PushSubscriptionSchema.index({ userId: 1 });

export default mongoose.models.PushSubscription ||
    mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
