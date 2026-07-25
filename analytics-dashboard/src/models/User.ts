import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string; // Optional because we use select: false
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false, // Prevents password from returning in queries by default
    },
    balance: {
        type: Number,
        default: 0.00, // Starting balance
    }
}, {
    timestamps: true,
});

// Prevent compilation errors during Next.js hot-reloads
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
