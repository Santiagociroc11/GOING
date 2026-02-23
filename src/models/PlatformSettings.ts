import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformSettings extends Document {
    commissionRate: number; // 0.3 = 30%
    balance: number;
    updatedAt: Date;
}

const PlatformSettingsSchema = new Schema(
    {
        commissionRate: { type: Number, default: 0.3 },
        balance: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.models.PlatformSettings ||
    mongoose.model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);
