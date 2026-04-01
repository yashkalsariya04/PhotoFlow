const { MongoClient } = require('mongodb');

async function listEvents() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('lumina-studio');
    
    // List all events
    const events = await db.collection('events').find({}).toArray();
    
    console.log(`📅 Found ${events.length} events:`);
    
    events.forEach((event, i) => {
      console.log(`\nEvent ${i + 1}:`);
      console.log(`  📝 Title: ${event.title}`);
      console.log(`  📱 Access Code: ${event.accessCode}`);
      console.log(`  🆔 ID: ${event._id}`);
      console.log(`  👤 Photographer: ${event.photographerId}`);
    });
    
    // Count photos for each event
    for (const event of events) {
      const photoCount = await db.collection('photos').countDocuments({ eventId: event._id });
      console.log(`  📸 Photos: ${photoCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

listEvents();
