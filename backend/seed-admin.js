
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  location: String,
  designation: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'yashkalsaria040@gmail.com';
    const adminPassword = 'password'; // In production, use a secure password
    const adminName = 'Admin User';

    
    // Check if user exists
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      console.log(`User ${adminEmail} already exists. Updating role to admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ User role updated to admin');
    } else {
      console.log(`Creating new admin user ${adminEmail}...`);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      const newUser = new User({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        designation: 'Administrator',
        location: 'Headquarters'
      });

      await newUser.save();
      console.log('✅ Admin user created successfully');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
