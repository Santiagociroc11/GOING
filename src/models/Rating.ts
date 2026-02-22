import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
    orderId: mongoose.Types.ObjectId;
    fromUserId: mongoose.Types.ObjectId; // quien califica
    toUserId: mongoose.Types.ObjectId;   // quien recibe la calificación
    role: "BUSINESS" | "DRIVER";          // rol del que califica
    score: number;                        // 1-5
    comment?: string;
    createdAt: Date;
}

const RatingSchema = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
        fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        role: { type: String, enum: ["BUSINESS", "DRIVER"], required: true },
        score: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true }
);

RatingSchema.index({ orderId: 1, fromUserId: 1 }, { unique: true });

export default mongoose.models.Rating || mongoose.model<IRating>("Rating", RatingSchema);
