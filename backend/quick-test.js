const fs = require('fs');
const path = require('path');

async function quickTest() {
  console.log('🚀 Quick test setup...');
  
  try {
    // Step 1: Login
    const loginResponse = await fetch('https://facematrix.sonomainfotech.in/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Logged in');
    
    // Step 2: Create event
    const eventResponse = await fetch('https://facematrix.sonomainfotech.in/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Pixel Test Event',
        description: 'Test pixel-based face recognition',
        eventDate: new Date().toISOString()
      })
    });
    
    if (!eventResponse.ok) {
      console.log('❌ Failed to create event');
      return;
    }
    
    const { event } = await eventResponse.json();
    console.log(`✅ Event created: ${event.accessCode}`);
    
    // Step 3: Upload one photo
    const imagePath = path.join(__dirname, 'uploads', 'test-photo-1.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'test-photo-1.jpg');
    formData.append('eventId', event._id);
    
    const uploadResponse = await fetch('https://facematrix.sonomainfotech.in/api/photos/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (uploadResponse.ok) {
      console.log('✅ Photo uploaded successfully');
    } else {
      console.log('❌ Photo upload failed');
    }
    
    // Step 4: Test face recognition
    const selfieFormData = new FormData();
    const selfieBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    selfieFormData.append('selfie', selfieBlob, 'selfie.jpg');
    selfieFormData.append('clientName', 'Test User');
    
    const faceResponse = await fetch(`https://facematrix.sonomainfotech.in/api/events/access/${event.accessCode}/recognize`, {
      method: 'POST',
      body: selfieFormData
    });
    
    if (faceResponse.ok) {
      const result = await faceResponse.json();
      console.log('✅ Face recognition test successful!');
      console.log(`📊 Results: ${result.matchedPhotoCount} photos found`);
      console.log(`🎨 Pixel matches: ${result.pixelMatches || 0}`);
      console.log(`🧠 Face matches: ${result.faceMatches || 0}`);
      console.log(`🔗 Test URL: https://facematrix.sonomainfotech.in/client/access/${event.accessCode}`);
    } else {
      const error = await faceResponse.text();
      console.log('❌ Face recognition failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();
