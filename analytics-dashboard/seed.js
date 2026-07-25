const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection URI
const MONGO_URI = 'mongodb://localhost:27017/voice-agent-telemetry';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 20.00 }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    // Delete existing test user if any
    await User.deleteOne({ username: 'testuser' });

    // Hash password 'password123'
    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        balance: 20.00
    });

    await testUser.save();
    console.log("Seeded test user successfully!");
    console.log("Username: testuser");
    console.log("Password: password123");

    await mongoose.disconnect();
}

seed().catch(err => console.error(err));
