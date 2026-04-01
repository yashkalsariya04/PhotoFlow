async function testAPI() {
  console.log('🔍 Testing API endpoints...');
  
  try {
    // Test 1: Get latest client access ID
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    
    await client.connect();
    const db = client.db('lumina-studio');
    
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
    console.log(`🆔 Client Access ID: ${accessId}`);
    console.log(`👤 Client: ${clientAccess[0].clientName}`);
    console.log(`📸 Matched Photos: ${clientAccess[0].matchedPhotoCount}`);
    console.log(`🆔 Matched IDs: ${clientAccess[0].matchedPhotoIds?.length || 0}`);
    
    // Test 2: Call the API endpoint
    console.log(`\n🌐 Testing: GET /events/client/${accessId}`);
    
    const response = await fetch(`https://PhotoFlow.sonomainfotech.in/api/events/client/${accessId}`);
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response successful!');
      console.log(`👤 Client: ${result.clientAccess?.clientName}`);
      console.log(`📸 Photos returned: ${result.photos?.length || 0}`);
      
      if (result.photos && result.photos.length > 0) {
        result.photos.forEach((photo, i) => {
          console.log(`\nPhoto ${i + 1}:`);
          console.log(`  🆔 ID: ${photo._id}`);
          console.log(`  📁 Filename: ${photo.filename}`);
          console.log(`  🔗 Photo URL: https://PhotoFlow.sonomainfotech.in/api/photos/${photo._id}`);
          console.log(`  🖼️ Thumbnail: https://PhotoFlow.sonomainfotech.in/api/photos/${photo._id}/thumbnail`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
