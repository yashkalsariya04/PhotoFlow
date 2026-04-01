// Test script for pixel-based face recognition
const fs = require('fs');
const path = require('path');

async function testPixelMatching() {
  console.log('🔍 Testing Pixel-Based Face Recognition System');
  console.log('=' .repeat(50));
  
  const ACCESS_CODE = 'HSVNL75B'; // From our test event
  
  try {
    // Step 1: Test the face recognition endpoint
    console.log('📸 Step 1: Testing face recognition with pixel analysis...');
    
    // Create a mock image buffer (in real testing, you'd use actual image files)
    const mockSelfie = Buffer.from('mock-selfie-image-data');
    
    const formData = new FormData();
    formData.append('selfie', new Blob([mockSelfie], { type: 'image/jpeg' }), 'selfie.jpg');
    formData.append('clientName', 'Test User');
    formData.append('clientEmail', 'test@pixel.com');
    
    const response = await fetch(`https://facematrix.sonomainfotech.in/api/events/access/${ACCESS_CODE}/recognize`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Face recognition successful!');
      console.log(`📊 Results:`);
      console.log(`   - Total matched photos: ${result.matchedPhotoCount}`);
      console.log(`   - Face matches: ${result.faceMatches || 0}`);
      console.log(`   - Pixel matches: ${result.pixelMatches || 0}`);
      
      if (result.pixelSimilarity && result.pixelSimilarity.length > 0) {
        console.log(`   - Pixel similarity scores:`);
        result.pixelSimilarity.forEach((photo, index) => {
          console.log(`     Photo ${index + 1}: ${(photo.similarity * 100).toFixed(1)}% similar`);
        });
      }
      
      console.log(`🔗 Client Access ID: ${result.clientAccess._id}`);
      console.log(`\n📱 You can view results at: https://facematrix.sonomainfotech.in/client/photos/${result.clientAccess._id}`);
      
    } else {
      const error = await response.text();
      console.log('❌ Face recognition failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n🎯 How to test with real images:');
  console.log('1. Upload some photos to your test event (HSVNL75B)');
  console.log('2. Go to: https://facematrix.sonomainfotech.in/client/access/HSVNL75B');
  console.log('3. Upload a selfie');
  console.log('4. The system will use both face recognition AND pixel similarity');
  console.log('5. Check the results for similar photos based on pixels!');
}

testPixelMatching();
