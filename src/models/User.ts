import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: "BUSINESS" | "DRIVER" | "ADMIN";
    city: string;
    active: boolean;
    businessDetails?: {
        companyName: string;
        taxId?: string;
    };
    driverDetails?: {
        vehicleType: string;
        licensePlate: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: false },
        role: { type: String, enum: ["BUSINESS", "DRIVER", "ADMIN"], required: true },
        city: { type: String, required: true, index: true },
        active: { type: Boolean, default: true },
        businessDetails: {
            companyName: String,
            taxId: String,
        },
        driverDetails: {
            vehicleType: String,
            licensePlate: String,
        },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
