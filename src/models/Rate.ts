import mongoose, { Schema, Document } from "mongoose";

export interface IRate extends Document {
    city: string;
    basePrice: number;
    pricePerKm: number;
    createdAt: Date;
    updatedAt: Date;
}

const RateSchema: Schema = new Schema(
    {
        city: { type: String, required: true, unique: true, index: true },
        basePrice: { type: Number, required: true },
        pricePerKm: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.models.Rate || mongoose.model<IRate>("Rate", RateSchema);
