// Test the client photos endpoint
async function testClientPhotos() {
  console.log('🔍 Testing client photos endpoint...');
  
  try {
    // First, run face recognition to get a client access ID
    console.log('📸 Running face recognition...');
    const quickTest = await import('./quick-test.js');
    
    // We need to get the latest client access ID from the database
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    
    await client.connect();
    const db = client.db('lumina-studio');
    
    // Get the most recent client access record
    const clientAccess = await db.collection('clientaccesses')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (clientAccess.length === 0) {
      console.log('❌ No client access records found');
      return;
    }
    
    const accessId = clientAccess[0]._id.toString();
    console.log(`🆔 Using client access ID: ${accessId}`);
    
    // Test the client photos endpoint
    const response = await fetch(`https://PhotoFlow.sonomainfotech.in/api/events/client-photos/${accessId}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Client photos endpoint working!');
      console.log(`📊 Client: ${result.clientAccess.clientName}`);
      console.log(`📸 Photos found: ${result.photos.length}`);
      
      if (result.photos.length > 0) {
        result.photos.forEach((photo, i) => {
          console.log(`\nPhoto ${i + 1}:`);
          console.log(`  📁 ID: ${photo._id}`);
          console.log(`  📂 Filename: ${photo.filename}`);
          console.log(`  🔗 URL: https://PhotoFlow.sonomainfotech.in/api/photos/${photo._id}`);
          console.log(`  🖼️ Thumbnail: https://PhotoFlow.sonomainfotech.in/api/photos/${photo._id}/thumbnail`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Client photos endpoint failed:', error);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testClientPhotos();
