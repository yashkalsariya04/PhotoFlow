const fs = require('fs');
const path = require('path');

async function uploadPhotos() {
  console.log('📤 Uploading photos to test event...');
  
  try {
    // Login
    const loginResponse = await fetch('https://photoflow.sonomainfotech.in/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const { token } = await loginResponse.json();
    console.log('✅ Logged in');
    
    // Event ID from previous run
    const eventId = '697c8c967ca71861c6f62cf6';
    const accessCode = 'UH4ZEQ5T';
    
    // Upload photos using the correct endpoint
    const uploadsDir = path.join(__dirname, 'uploads');
    const testFiles = ['test-photo-1.jpg', 'test-photo-2.jpg', 'test-photo-3.jpg', 'test-photo-4.jpg', 'test-photo-5.jpg'];
    
    for (const filename of testFiles) {
      const imagePath = path.join(uploadsDir, filename);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ File not found: ${filename}`);
        continue;
      }
      
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Create FormData for upload
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('file', blob, filename);  // Changed from 'files' to 'file'
      formData.append('eventId', eventId);
      
      console.log(`📤 Uploading ${filename}...`);
      
      const uploadResponse = await fetch('https://photoflow.sonomainfotech.in/api/photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log(`✅ Uploaded ${filename}:`, result.photos?.length || 1, 'photo(s)');
      } else {
        const error = await uploadResponse.text();
        console.log(`❌ Failed to upload ${filename}:`, error);
      }
    }
    
    console.log('\n🎉 Upload complete!');
    console.log(`📱 Access Code: ${accessCode}`);
    console.log(`🔗 Test URL: https://photoflow.sonomainfotech.in/client/access/${accessCode}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

uploadPhotos();
