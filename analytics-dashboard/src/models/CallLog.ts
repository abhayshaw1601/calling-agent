import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICallLog extends Document {
  callSid: string;
  phoneNumber: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration: number;
  costDetails: {
    twilioCost: number;
    deepgramCost: number;
    geminiCost: number;
    elevenlabsCost: number;
    totalCost: number;
  };
  transcript: Array<{
    role: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema: Schema = new Schema({
  callSid: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in-progress', 'completed', 'failed'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  costDetails: {
    twilioCost: { type: Number, default: 0 },
    deepgramCost: { type: Number, default: 0 },
    geminiCost: { type: Number, default: 0 },
    elevenlabsCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }
  },
  transcript: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Guard checks if model already exists (typical in Next.js hot-reloads)
const CallLog: Model<ICallLog> = mongoose.models.CallLog || mongoose.model<ICallLog>('CallLog', CallLogSchema);

export default CallLog;
