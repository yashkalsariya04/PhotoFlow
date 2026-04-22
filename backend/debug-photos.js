// Debug photo file paths and access
async function debugPhotos() {
  console.log('🔍 Debugging photo access...');
  
  try {
    const { MongoClient } = require('mongodb');
    const fs = require('fs');
    const path = require('path');
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
      console.log('❌ No photos found in database');
      return;
    }
    
    const photoData = photo[0];
    console.log('📸 Photo Data:');
    console.log(`  🆔 ID: ${photoData._id}`);
    console.log(`  📁 Filename: ${photoData.filename}`);
    console.log(`  🖼️ Thumbnail: ${photoData.thumbnailFilename}`);
    console.log(`  👤 User ID: ${photoData.userId}`);
    console.log(`  📅 Event ID: ${photoData.eventId}`);
    
    // Check file paths
    const uploadDir = path.join(process.cwd(), 'uploads');
    console.log(`\n📂 Upload Directory: ${uploadDir}`);
    console.log(`📁 Directory exists: ${fs.existsSync(uploadDir)}`);
    
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      console.log(`📄 Files in uploads: ${files.length}`);
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    
    // Check specific photo files
    const photoPath = path.join(uploadDir, photoData.filename);
    const thumbnailPath = path.join(uploadDir, photoData.thumbnailFilename);
    
    console.log(`\n🔍 File Checks:`);
    console.log(`  📸 Photo file: ${photoPath}`);
    console.log(`  ✅ Exists: ${fs.existsSync(photoPath)}`);
    
    console.log(`  🖼️ Thumbnail file: ${thumbnailPath}`);
    console.log(`  ✅ Exists: ${fs.existsSync(thumbnailPath)}`);
    
    // Test the API endpoints
    console.log(`\n🌐 API Tests:`);
    
    // Test public thumbnail
    try {
      const response = await fetch(`https://PhotoFlow.in/api/photos/${photoData._id}/thumbnail/public`);
      console.log(`  🖼️ Public Thumbnail Status: ${response.status}`);
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        console.log(`  📊 Thumbnail Size: ${buffer.byteLength} bytes`);
        console.log(`  ✅ Public thumbnail working!`);
      } else {
        const error = await response.text();
        console.log(`  ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`  ❌ Network Error: ${error.message}`);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugPhotos();
