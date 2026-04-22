// Test the public thumbnail endpoint
async function testThumbnails() {
  console.log('🖼️ Testing public thumbnail endpoint...');
  
  try {
    // Get the latest photo ID
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    
    await client.connect();
    const db = client.db('lumina-studio');
    
    // Get the most recent photo
    const photo = await db.collection('photos')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (photo.length === 0) {
      console.log('❌ No photos found');
      return;
    }
    
    const photoId = photo[0]._id.toString();
    console.log(`🆔 Photo ID: ${photoId}`);
    console.log(`📁 Filename: ${photo[0].filename}`);
    
    // Test both thumbnail endpoints
    console.log('\n🔍 Testing endpoints:');
    
    // Test authenticated thumbnail (should fail without auth)
    console.log('1. Authenticated thumbnail:');
    try {
      const authResponse = await fetch(`https://PhotoFlow.in/api/photos/${photoId}/thumbnail`);
      console.log(`   Status: ${authResponse.status} (expected 401)`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    
    // Test public thumbnail (should work)
    console.log('2. Public thumbnail:');
    try {
      const publicResponse = await fetch(`https://PhotoFlow.in/api/photos/${photoId}/thumbnail/public`);
      console.log(`   Status: ${publicResponse.status}`);
      
      if (publicResponse.ok) {
        const contentType = publicResponse.headers.get('content-type');
        const contentLength = publicResponse.headers.get('content-length');
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Content-Length: ${contentLength} bytes`);
        console.log('   ✅ Public thumbnail working!');
      } else {
        const error = await publicResponse.text();
        console.log(`   ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testThumbnails();
