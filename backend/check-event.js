const { MongoClient } = require('mongodb');

async function checkEvent() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('lumina-studio');
    
    // Find the test event
    const event = await db.collection('events').findOne({ accessCode: 'UH4ZEQ5T' });
    
    if (!event) {
      console.log('❌ Test event UH4ZEQ5T not found');
      return;
    }
    
    console.log('✅ Event found:', event.title);
    console.log('📅 Event ID:', event._id);
    console.log('👤 Photographer ID:', event.photographerId);
    
    // Find photos for this event
    const photos = await db.collection('photos').find({ eventId: event._id }).toArray();
    
    console.log(`\n📸 Photos in event: ${photos.length}`);
    
    if (photos.length === 0) {
      console.log('\n❌ No photos found in this event!');
      console.log('💡 You need to upload photos first before testing face recognition');
    } else {
      photos.forEach((photo, i) => {
        console.log(`\nPhoto ${i + 1}:`);
        console.log(`  📁 Filename: ${photo.originalName}`);
        console.log(`  🧠 Face Count: ${photo.faceCount}`);
        console.log(`  🎨 Pixel Features: ${photo.pixelFeatures ? 'Yes' : 'No'}`);
        console.log(`  📊 Face Embeddings: ${photo.faceEmbeddings ? photo.faceEmbeddings.length : 0}`);
        console.log(`  📅 Uploaded: ${photo.createdAt}`);
      });
    }
    
    // Check client access records
    const clientAccess = await db.collection('clientaccesses').find({ eventId: event._id }).toArray();
    console.log(`\n👥 Client access records: ${clientAccess.length}`);
    
    clientAccess.forEach((access, i) => {
      console.log(`\nClient ${i + 1}:`);
      console.log(`  👤 Name: ${access.clientName}`);
      console.log(`  📧 Email: ${access.clientEmail}`);
      console.log(`  📸 Matched Photos: ${access.matchedPhotoCount}`);
      console.log(`  🆔 Matched IDs: ${access.matchedPhotoIds?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkEvent();
