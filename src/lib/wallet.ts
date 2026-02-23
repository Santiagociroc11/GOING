import mongoose from "mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import PlatformSettings from "@/models/PlatformSettings";

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

/** Obtiene la tasa de comisión (0.3 = 30%). Default 0.3. */
export async function getCommissionRate(): Promise<number> {
    const settings = await PlatformSettings.findOne().lean();
    return settings?.commissionRate ?? 0.3;
}

/** Paga al domiciliario y retiene comisión para Going. Driver recibe 70%, Going 30%. */
export async function creditOrderPayment(
    driverId: mongoose.Types.ObjectId,
    orderPrice: number,
    orderId: mongoose.Types.ObjectId
): Promise<void> {
    const rate = await getCommissionRate();
    const driverAmount = Number((orderPrice * (1 - rate)).toFixed(2));
    const platformAmount = Number((orderPrice * rate).toFixed(2));

    await creditDriverBalance(driverId, driverAmount, orderId, `Pago por entrega (70%, comisión ${(rate * 100).toFixed(0)}%)`);

    await PlatformSettings.findOneAndUpdate(
        {},
        { $inc: { balance: platformAmount } },
        { upsert: true }
    );
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
