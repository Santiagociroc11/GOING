import mongoose, { Schema, Document } from "mongoose";

export interface IInAppNotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    body?: string;
    url?: string;
    read: boolean;
    createdAt: Date;
}

const InAppNotificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true },
        body: { type: String },
        url: { type: String },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

InAppNotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.InAppNotification ||
    mongoose.model<IInAppNotification>("InAppNotification", InAppNotificationSchema);
