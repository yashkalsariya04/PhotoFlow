// Test the fixed thumbnail endpoint
async function testThumbnailFix() {
  console.log('🖼️ Testing fixed thumbnail endpoint...');
  
  try {
    // Get the latest photo
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    
    await client.connect();
    const db = client.db('lumina-studio');
    
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
    const userId = photo[0].userId.toString();
    console.log(`🆔 Photo ID: ${photoId}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📁 Filename: ${photo[0].filename}`);
    console.log(`🖼️ Thumbnail: ${photo[0].thumbnailFilename}`);
    
    // Test the public thumbnail endpoint
    console.log('\n🌐 Testing public thumbnail:');
    const response = await fetch(`https://PhotoFlow.sonomainfotech.in/api/photos/${photoId}/thumbnail/public`);
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log(`✅ Success!`);
      console.log(`📄 Content-Type: ${contentType}`);
      console.log(`📏 Size: ${contentLength} bytes`);
      
      // Save the thumbnail to verify it works
      const buffer = await response.arrayBuffer();
      require('fs').writeFileSync('test-thumbnail.jpg', Buffer.from(buffer));
      console.log(`💾 Saved as: test-thumbnail.jpg`);
      
      console.log(`\n🔗 Test URL: https://PhotoFlow.sonomainfotech.in/client/access/JXPYWF5D`);
      console.log(`🖼️ Thumbnail URL: https://PhotoFlow.sonomainfotech.in/api/photos/${photoId}/thumbnail/public`);
      
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testThumbnailFix();
