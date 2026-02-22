import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
    | "businessOrderAccepted"
    | "businessOrderPickedUp"
    | "businessOrderDelivered"
    | "businessOrderCancelled"
    | "driverNewOrder"
    | "driverOrderCancelled"
    | "businessRecharge";

export interface INotificationSettings extends Document {
    businessOrderAccepted: boolean;
    businessOrderPickedUp: boolean;
    businessOrderDelivered: boolean;
    businessOrderCancelled: boolean;
    driverNewOrder: boolean;
    driverOrderCancelled: boolean;
    businessRecharge: boolean;
    updatedAt: Date;
}

const NotificationSettingsSchema = new Schema(
    {
        businessOrderAccepted: { type: Boolean, default: true },
        businessOrderPickedUp: { type: Boolean, default: true },
        businessOrderDelivered: { type: Boolean, default: true },
        businessOrderCancelled: { type: Boolean, default: true },
        driverNewOrder: { type: Boolean, default: true },
        driverOrderCancelled: { type: Boolean, default: true },
        businessRecharge: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.NotificationSettings ||
    mongoose.model<INotificationSettings>("NotificationSettings", NotificationSettingsSchema);
