const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
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
    type: Number, // In seconds
    default: 0
  },
  costDetails: {
    twilioCost: { type: Number, default: 0 },
    deepgramCost: { type: Number, default: 0 },
    geminiCost: { type: Number, default: 0 },
    elevenlabsCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }
  },
  // Arrays to hold dialogue history/telemetry
  transcript: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('CallLog', CallLogSchema);
