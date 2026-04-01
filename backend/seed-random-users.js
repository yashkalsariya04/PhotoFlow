
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
  designation: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const DUMMY_USERS = [
  { name: 'Alice Smith', email: 'alice.smith@example.com', location: 'New York', designation: 'Photographer' },
  { name: 'Bob Jones', email: 'bob.jones@example.com', location: 'London', designation: 'Editor' },
  { name: 'Charlie Brown', email: 'charlie.brown@example.com', location: 'Paris', designation: 'Designer' },
  { name: 'Diana Prince', email: 'diana.prince@example.com', location: 'Themyscira', designation: 'Manager' },
  { name: 'Evan Wright', email: 'evan.wright@example.com', location: 'Sydney', designation: 'Freelancer' },
  { name: 'Fiona Green', email: 'fiona.green@example.com', location: 'Dublin', designation: 'Assistant' },
  { name: 'George King', email: 'george.king@example.com', location: 'Toronto', designation: 'Director' },
  { name: 'Hannah Scott', email: 'hannah.scott@example.com', location: 'Berlin', designation: 'Producer' },
  { name: 'Ian White', email: 'ian.white@example.com', location: 'Tokyo', designation: 'Coordinator' },
  { name: 'Julia Hall', email: 'julia.hall@example.com', location: 'Rome', designation: 'Consultant' },
  { name: 'Kevin Lee', email: 'kevin.lee@example.com', location: 'Seoul', designation: 'Developer' },
  { name: 'Laura Adams', email: 'laura.adams@example.com', location: 'Chicago', designation: 'Marketing' },
  { name: 'Mike Wilson', email: 'mike.wilson@example.com', location: 'Austin', designation: 'Sales' },
  { name: 'Nina Thomas', email: 'nina.thomas@example.com', location: 'Denver', designation: 'Support' },
  { name: 'Oliver Clark', email: 'oliver.clark@example.com', location: 'Seattle', designation: 'Engineer' }
];

// Target months: Sep 2025 to Jan 2026
const TARGET_MONTHS = [
  { year: 2026, month: 0, count: 4 }, // Jan 2026: 4 users
  { year: 2025, month: 11, count: 6 }, // Dec 2025: 6 users
  { year: 2025, month: 10, count: 3 }, // Nov 2025: 3 users
  { year: 2025, month: 9, count: 2 },  // Oct 2025: 2 users
  { year: 2025, month: 8, count: 5 }   // Sep 2025: 5 users
];

function getRandomDateInMonth(year, month) {
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  date.setDate(randomDay);
  // Add random time
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function seedUsers() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const passwordHash = await bcrypt.hash('password123', 10);
    
    let userIndex = 0;

    for (const period of TARGET_MONTHS) {
      // Create specific number of users per month
      const count = period.count;
      
      console.log(`Creating ${count} users for ${period.year}-${period.month + 1}...`);

      for (let i = 0; i < count; i++) {
        if (userIndex >= DUMMY_USERS.length) userIndex = 0; // Recycle names if needed
        
        const userData = DUMMY_USERS[userIndex++];
        // Make email unique if recycling
        const uniqueSuffix = Math.floor(Math.random() * 10000);
        const email = userData.email.replace('@', `.${uniqueSuffix}@`);

        const createdAt = getRandomDateInMonth(period.year, period.month);

        const newUser = new User({
          name: userData.name,
          email: email,
          passwordHash,
          role: 'user',
          designation: userData.designation,
          location: userData.location,
          createdAt: createdAt,
          updatedAt: createdAt,
          isActive: true
        });

        try {
            await newUser.save();
            console.log(`   + Created ${newUser.name} (${newUser.email}) on ${createdAt.toISOString().split('T')[0]}`);
        } catch (err) {
            console.log(`   - Failed to create ${newUser.email}: ${err.message}`);
        }
      }
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
