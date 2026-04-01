const fs = require('fs');
const path = require('path');

async function createTestData() {
  console.log('🚀 Creating test data for face recognition...');
  
  try {
    // Step 1: Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('https://PhotoFlow.sonomainfotech.in/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please register first.');
      return;
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Logged in successfully');
    
    // Step 2: Create test event
    console.log('📅 Creating test event...');
    const eventResponse = await fetch('https://PhotoFlow.sonomainfotech.in/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Face Recognition Test Event',
        description: 'Test event for face recognition and pixel similarity',
        eventDate: new Date().toISOString()
      })
    });
    
    if (!eventResponse.ok) {
      console.log('❌ Failed to create event');
      return;
    }
    
    const { event } = await eventResponse.json();
    console.log(`✅ Test event created: ${event.title}`);
    console.log(`📱 Access Code: ${event.accessCode}`);
    console.log(`🆔 Event ID: ${event._id}`);
    
    // Step 3: Create test images
    console.log('📸 Creating test images...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create simple test images (1x1 pixel colored images)
    const testImages = [
      { name: 'test-photo-1.jpg', color: [255, 0, 0], description: 'Red photo' },
      { name: 'test-photo-2.jpg', color: [0, 255, 0], description: 'Green photo' },
      { name: 'test-photo-3.jpg', color: [0, 0, 255], description: 'Blue photo' },
      { name: 'test-photo-4.jpg', color: [255, 255, 0], description: 'Yellow photo' },
      { name: 'test-photo-5.jpg', color: [255, 0, 255], description: 'Magenta photo' }
    ];
    
    for (const img of testImages) {
      const imagePath = path.join(uploadsDir, img.name);
      
      // Create a simple 100x100 colored image buffer
      const imageData = Buffer.alloc(100 * 100 * 3);
      for (let i = 0; i < imageData.length; i += 3) {
        imageData[i] = img.color[0];     // R
        imageData[i + 1] = img.color[1]; // G  
        imageData[i + 2] = img.color[2]; // B
      }
      
      fs.writeFileSync(imagePath, imageData);
      console.log(`✅ Created ${img.description}: ${img.name}`);
    }
    
    // Step 4: Upload test photos to the event
    console.log('📤 Uploading test photos...');
    
    for (let i = 0; i < testImages.length; i++) {
      const img = testImages[i];
      const imagePath = path.join(uploadsDir, img.name);
      const imageBuffer = fs.readFileSync(imagePath);
      
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('files', blob, img.name);
      formData.append('eventId', event._id);
      
      const uploadResponse = await fetch('https://PhotoFlow.sonomainfotech.in/api/photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        console.log(`✅ Uploaded ${img.description}`);
      } else {
        console.log(`❌ Failed to upload ${img.description}`);
      }
    }
    
    console.log('\n🎉 Test setup complete!');
    console.log(`📱 Access Code: ${event.accessCode}`);
    console.log(`🔗 Test URL: https://PhotoFlow.sonomainfotech.in/client/access/${event.accessCode}`);
    console.log(`📸 Photos uploaded: ${testImages.length}`);
    console.log('\n🧪 Now you can test face recognition with pixel similarity!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createTestData();
