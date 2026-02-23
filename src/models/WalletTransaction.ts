import mongoose, { Schema, Document } from "mongoose";

export type WalletTransactionType =
    | "RECHARGE"        // Admin recarga saldo al negocio
    | "ORDER_DEDUCT"    // Deducción al crear orden
    | "ORDER_REFUND"    // Devolución por orden cancelada
    | "DRIVER_PAY"      // Acreditación al domiciliario por entrega (70%)
    | "PLATFORM_INCOME"; // Comisión Going (30%)

export interface IWalletTransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: WalletTransactionType;
    amount: number; // Positivo = ingreso, negativo = egreso
    balanceAfter?: number;
    orderId?: mongoose.Types.ObjectId;
    note?: string;
    createdBy?: mongoose.Types.ObjectId; // Admin que hizo recarga
    createdAt: Date;
}

const WalletTransactionSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, enum: ["RECHARGE", "ORDER_DEDUCT", "ORDER_REFUND", "DRIVER_PAY", "PLATFORM_INCOME"], required: true },
        amount: { type: Number, required: true },
        balanceAfter: { type: Number },
        orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
        note: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
