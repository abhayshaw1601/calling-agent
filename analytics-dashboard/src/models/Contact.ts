import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContact extends Document {
    name: string;
    phoneNumber: string;
    customPrompt: string;
    status: 'pending' | 'called' | 'failed';
    callSid?: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    customPrompt: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'called', 'failed'],
        default: 'pending'
    },
    callSid: { type: String },
    username: { type: String, required: true }
}, {
    timestamps: true
});

const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
