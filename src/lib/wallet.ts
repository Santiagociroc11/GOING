import mongoose from "mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import Order from "@/models/Order";

export async function deductBusinessBalance(
    businessId: mongoose.Types.ObjectId,
    amount: number,
    orderId: mongoose.Types.ObjectId,
    note?: string
): Promise<{ ok: boolean; message?: string }> {
    const user = await User.findById(businessId);
    if (!user) return { ok: false, message: "Negocio no encontrado" };

    const balance = (user.balance ?? 0);
    if (balance < amount) {
        return { ok: false, message: `Saldo insuficiente. Tienes $${balance.toLocaleString()}, necesitas $${amount.toLocaleString()}. Recarga tu saldo.` };
    }

    const newBalance = balance - amount;
    await User.findByIdAndUpdate(businessId, { $set: { balance: newBalance } });
    await WalletTransaction.create({
        userId: businessId,
        type: "ORDER_DEDUCT",
        amount: -amount,
        balanceAfter: newBalance,
        orderId,
        note: note ?? "Deducción por creación de orden",
    });
    return { ok: true };
}

export async function wasOrderRefunded(orderId: mongoose.Types.ObjectId): Promise<boolean> {
    const tx = await WalletTransaction.findOne({ orderId, type: "ORDER_REFUND" });
    return !!tx;
}

export async function wasDriverPaid(orderId: mongoose.Types.ObjectId): Promise<boolean> {
    const tx = await WalletTransaction.findOne({ orderId, type: "DRIVER_PAY" });
    return !!tx;
}

export async function refundBusinessBalance(
    businessId: mongoose.Types.ObjectId,
    amount: number,
    orderId: mongoose.Types.ObjectId,
    note?: string
): Promise<void> {
    const user = await User.findById(businessId);
    if (!user) return;

    const balance = (user.balance ?? 0) + amount;
    await User.findByIdAndUpdate(businessId, { $set: { balance } });
    await WalletTransaction.create({
        userId: businessId,
        type: "ORDER_REFUND",
        amount,
        balanceAfter: balance,
        orderId,
        note: note ?? "Devolución por orden cancelada",
    });
}

export async function creditDriverBalance(
    driverId: mongoose.Types.ObjectId,
    amount: number,
    orderId: mongoose.Types.ObjectId,
    note?: string
): Promise<void> {
    const user = await User.findById(driverId);
    if (!user) return;

    const balance = (user.balance ?? 0) + amount;
    await User.findByIdAndUpdate(driverId, { $set: { balance } });
    await WalletTransaction.create({
        userId: driverId,
        type: "DRIVER_PAY",
        amount,
        balanceAfter: balance,
        orderId,
        note: note ?? "Pago por entrega completada",
    });
}

export async function rechargeBusinessBalance(
    businessId: mongoose.Types.ObjectId,
    amount: number,
    adminId: mongoose.Types.ObjectId,
    note?: string
): Promise<{ ok: boolean; message?: string }> {
    if (amount <= 0) return { ok: false, message: "El monto debe ser mayor a 0" };

    const user = await User.findById(businessId);
    if (!user) return { ok: false, message: "Negocio no encontrado" };
    if (user.role !== "BUSINESS") return { ok: false, message: "Solo se puede recargar saldo a negocios" };

    const balance = (user.balance ?? 0) + amount;
    await User.findByIdAndUpdate(businessId, { $set: { balance } });
    await WalletTransaction.create({
        userId: businessId,
        type: "RECHARGE",
        amount,
        balanceAfter: balance,
        note: note ?? "Recarga manual por administrador",
        createdBy: adminId,
    });
    return { ok: true };
}
