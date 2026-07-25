const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    customPrompt: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'called', 'failed'],
        default: 'pending'
    },
    callSid: {
        type: String
    },
    username: {
        type: String,
        required: true // Associate contact campaigns to a user
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', ContactSchema);
