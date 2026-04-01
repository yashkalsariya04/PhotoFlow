
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const eventSchema = new mongoose.Schema({
  photographerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  eventDate: { type: Date, required: true },
  accessCode: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  photoCount: { type: Number, default: 0 },
  clientAccessCount: { type: Number, default: 0 },
  coverPhotoId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
// We need a valid photographer ID. Let's fetch the first admin or user.
const userSchema = new mongoose.Schema({
  email: String
});
const User = mongoose.model('User', userSchema);

const EVENT_TITLES = [
  'Wedding Ceremony', 'Corporate Gala', 'Birthday Bash', 'Music Festival', 
  'Product Launch', 'Charity Fundraiser', 'Art Exhibition', 'Fashion Show',
  'Sports Tournament', 'Conference 2025', 'Engagement Party', 'Baby Shower',
  'Graduation Ceremony', 'Reunion Dinner', 'Holiday Party', 'Team Building',
  'Workshop Series', 'Networking Event', 'Award Night', 'Summer Picnic'
];

// Target months: Sep 2025 to Jan 2026
const TARGET_MONTHS = [
  { year: 2026, month: 1, count: 10 } // Feb 2026: 10 events
];

function getRandomDateInMonth(year, month) {
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  date.setDate(randomDay);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function generateAccessCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function seedEvents() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find a photographer to assign events to
    const photographer = await User.findOne();
    if (!photographer) {
      console.error('❌ No users found to assign events to. Please seed users first.');
      process.exit(1);
    }
    console.log(`Assigning events to photographer: ${photographer.email} (${photographer._id})`);

    let titleIndex = 0;

    for (const period of TARGET_MONTHS) {
      const count = period.count;
      console.log(`Creating ${count} events for ${period.year}-${period.month + 1}...`);

      for (let i = 0; i < count; i++) {
        if (titleIndex >= EVENT_TITLES.length) titleIndex = 0;
        
        const eventDate = getRandomDateInMonth(period.year, period.month);
        const title = `${EVENT_TITLES[titleIndex++]} ${Math.floor(Math.random() * 100)}`;
        
        // Generate unique access code
        let accessCode = generateAccessCode();
        // Simple check to avoid duplicates in this batch (DB will enforce uniqueness anyway)
        
        const newEvent = new Event({
          photographerId: photographer._id,
          title: title,
          description: `Auto-generated event for ${title}`,
          eventDate: eventDate,
          accessCode: accessCode,
          isActive: true,
          photoCount: Math.floor(Math.random() * 500), // Random photo count
          clientAccessCount: Math.floor(Math.random() * 50), // Random client access count
          createdAt: eventDate,
          updatedAt: eventDate
        });

        try {
          await newEvent.save();
          console.log(`   + Created "${title}" on ${eventDate.toISOString().split('T')[0]}`);
        } catch (err) {
          console.log(`   - Failed to create event: ${err.message}`);
        }
      }
    }

    console.log('✅ Event seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
}

seedEvents();
