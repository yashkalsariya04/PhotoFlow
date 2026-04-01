// Comprehensive debug of photo loading issue
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function debugPhotoLoading() {
  console.log('🔍 Comprehensive Photo Loading Debug');
  console.log('=====================================');
  
  try {
    // 1. Check database connection and data
    console.log('\n📊 1. DATABASE CHECK');
    const uri = 'mongodb+srv://24mca56_db_user:DC$u8WmJEQg!G8r@cluster0.dnpe0gd.mongodb.net/lumina-studio';
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('lumina-studio');
    
    // Get latest client access with photos
    const clientAccess = await db.collection('clientaccesses')
      .find({ matchedPhotoCount: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (clientAccess.length === 0) {
      console.log('❌ No client access records with photos found');
      await client.close();
      return;
    }
    
    const access = clientAccess[0];
    console.log(`✅ Found client access: ${access.clientName}`);
    console.log(`📸 Matched photos: ${access.matchedPhotoCount}`);
    console.log(`🆔 Access ID: ${access._id}`);
    console.log(`📅 Created: ${access.createdAt}`);
    
    // Get the matched photos
    const photos = await db.collection('photos')
      .find({ _id: { $in: access.matchedPhotoIds } })
      .toArray();
    
    console.log(`\n📸 2. PHOTO DETAILS (${photos.length} photos)`);
    photos.forEach((photo, i) => {
      console.log(`\nPhoto ${i+1}:`);
      console.log(`  🆔 ID: ${photo._id}`);
      console.log(`  📁 Filename: ${photo.filename}`);
      console.log(`  🖼️ Thumbnail: ${photo.thumbnailFilename}`);
      console.log(`  👤 User ID: ${photo.userId}`);
      console.log(`  📏 Size: ${photo.metadata?.width}x${photo.metadata?.height}`);
      console.log(`  🧠 Faces: ${photo.faceCount}`);
      console.log(`  🎨 Pixels: ${photo.pixelFeatures ? 'Yes' : 'No'}`);
    });
    
    // 3. Check file system
    console.log(`\n💾 3. FILE SYSTEM CHECK`);
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`📂 Uploads directory: ${uploadsDir}`);
    console.log(`✅ Exists: ${fs.existsSync(uploadsDir)}`);
    
    if (fs.existsSync(uploadsDir)) {
      const userDirs = fs.readdirSync(uploadsDir).filter(item => {
        const itemPath = path.join(uploadsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
      
      console.log(`👥 User directories: ${userDirs.length}`);
      userDirs.forEach(dir => console.log(`  - ${dir}`));
      
      // Check each photo file
      photos.forEach((photo, i) => {
        const userDir = photo.userId.toString();
        const photoPath = path.join(uploadsDir, userDir, photo.filename);
        const thumbPath = path.join(uploadsDir, userDir, photo.thumbnailFilename);
        
        console.log(`\nPhoto ${i+1} file check:`);
        console.log(`  📸 Photo: ${photoPath}`);
        console.log(`  ✅ Exists: ${fs.existsSync(photoPath)}`);
        console.log(`  🖼️ Thumbnail: ${thumbPath}`);
        console.log(`  ✅ Exists: ${fs.existsSync(thumbPath)}`);
        
        if (fs.existsSync(photoPath)) {
          const stats = fs.statSync(photoPath);
          console.log(`  📏 Size: ${stats.size} bytes`);
        }
      });
    }
    
    // 4. Test API endpoints
    console.log(`\n🌐 4. API ENDPOINT TESTS`);

    
    
    try {
      // Test client photos endpoint
      const clientResponse = await fetch(`https://photoflow.sonomainfotech.in/api/events/client/${access._id}`);
      console.log(`📊 Client Photos API: ${clientResponse.status}`);
      
      if (clientResponse.ok) {
        const result = await clientResponse.json();
        console.log(`✅ API Success - returned ${result.photos?.length || 0} photos`);
        
        // Test thumbnail endpoints
        if (result.photos && result.photos.length > 0) {
          console.log(`\n🖼️ 5. THUMBNAIL ENDPOINT TESTS`);
          
          for (let i = 0; i < Math.min(result.photos.length, 3); i++) {
            const photo = result.photos[i];
            const thumbnailUrl = `https://PhotoFlow.sonomainfotech.in/api/photos/${photo._id}/thumbnail/public`;
            
            try {
              const thumbResponse = await fetch(thumbnailUrl);
              console.log(`Photo ${i+1} thumbnail: ${thumbResponse.status} ${thumbResponse.ok ? '✅' : '❌'}`);
              
              if (thumbResponse.ok) {
                const contentLength = thumbResponse.headers.get('content-length');
                console.log(`  📏 Size: ${contentLength} bytes`);
              } else {
                const error = await thumbResponse.text();
                console.log(`  ❌ Error: ${error.substring(0, 100)}`);
              }
            } catch (error) {
              console.log(`Photo ${i+1} thumbnail: ❌ Network Error - ${error.message}`);
            }
          }
        }
      } else {
        const error = await clientResponse.text();
        console.log(`❌ API Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
    
    await client.close();
    
    // 6. Summary and recommendations
    console.log(`\n🎯 6. SUMMARY & RECOMMENDATIONS`);
    console.log(`================================`);
    console.log(`📱 Test URL: http://localhost:7114/client/access/[EVENT_CODE]`);
    console.log(`🔍 Debug: Open browser dev tools and check Network tab`);
    console.log(`📸 Photos in DB: ${photos.length}`);
    console.log(`🆔 Client Access ID: ${access._id}`);
    
    if (photos.length > 0) {
      console.log(`\n✅ Next Steps:`);
      console.log(`1. Go to: http://localhost:7114/client/access/[EVENT_CODE]`);
      console.log(`2. Upload a selfie`);
      console.log(`3. Check browser Network tab for API calls`);
      console.log(`4. Look for 404 errors on thumbnail requests`);
    } else {
      console.log(`\n❌ Issue: No photos found in database`);
      console.log(`1. Upload photos to an event first`);
      console.log(`2. Run face recognition to create client access`);
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

debugPhotoLoading();
