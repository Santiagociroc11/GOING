import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
    businessId: mongoose.Types.ObjectId;
    driverId?: mongoose.Types.ObjectId;
    city: string;
    status: "PENDING" | "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";
    pickupInfo: {
        address: string;
        coordinates: {
            type: "Point";
            coordinates: number[]; // [longitude, latitude]
        };
        contactName: string;
        contactPhone: string;
    };
    dropoffInfo: {
        address: string;
        coordinates: {
            type: "Point";
            coordinates: number[]; // [longitude, latitude]
        };
        contactName: string;
        contactPhone: string;
    };
    price: number;
    details: string;
    paymentMethod: "PREPAID" | "COD";
    productValue?: number; // Valor del producto a recaudar (solo cuando paymentMethod === "COD")
    pickupProofUrl?: string;
    deliveryProofUrl?: string;
    codCollectedAt?: Date; // Confirmación de recaudo COD por el negocio
    lastReminderAt?: Date;
    reminderCount?: number;
    lastDriverLocation?: { lat: number; lng: number; updatedAt: Date };
    acceptedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        driverId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        city: { type: String, required: true, index: true }, // Clave para despachar ordenes por ciudad
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "PICKED_UP", "DELIVERED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },
        pickupInfo: {
            address: { type: String, required: true },
            coordinates: {
                type: { type: String, enum: ["Point"], default: "Point" },
                coordinates: { type: [Number], required: true }, // [lng, lat]
            },
            contactName: { type: String, required: true },
            contactPhone: { type: String, required: true },
        },
        dropoffInfo: {
            address: { type: String, required: true },
            coordinates: {
                type: { type: String, enum: ["Point"], default: "Point" },
                coordinates: { type: [Number], required: true }, // [lng, lat]
            },
            contactName: { type: String, required: true },
            contactPhone: { type: String, required: true },
        },
        price: { type: Number, required: true },
        details: { type: String, required: true },
        paymentMethod: { type: String, enum: ["PREPAID", "COD"], default: "PREPAID" },
        productValue: { type: Number },
        pickupProofUrl: { type: String },
        deliveryProofUrl: { type: String },
        codCollectedAt: { type: Date },
        lastReminderAt: { type: Date },
        reminderCount: { type: Number, default: 0 },
        lastDriverLocation: {
            lat: Number,
            lng: Number,
            updatedAt: Date,
        },
        acceptedAt: { type: Date },
        pickedUpAt: { type: Date },
        deliveredAt: { type: Date },
    },
    { timestamps: true }
);

// Compound index for optimizing driver feed queries (city + status)
OrderSchema.index({ city: 1, status: 1 });
OrderSchema.index({ "pickupInfo.coordinates": "2dsphere" });
OrderSchema.index({ "dropoffInfo.coordinates": "2dsphere" });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
