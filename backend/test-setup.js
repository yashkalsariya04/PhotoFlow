const fs = require('fs');
const path = require('path');

// Create a simple test script to set up test data
async function setupTestData() {
  console.log('🚀 Setting up test data for face recognition...');
  
  try {
    // Create a test event via API
    const response = await fetch('https://facematrix.sonomainfotech.in/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!response.ok) {
      console.log('❌ Login failed. Please register first.');
      return;
    }
    
    const { token } = await response.json();
    console.log('✅ Logged in successfully');
    
    // Create test event
    const eventResponse = await fetch('https://facematrix.sonomainfotech.in/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Face Recognition Test Event',
        description: 'Test event for face recognition functionality',
        eventDate: new Date().toISOString()
      })
    });
    
    if (eventResponse.ok) {
      const { event } = await eventResponse.json();
      console.log(`✅ Test event created: ${event.title}`);
      console.log(`📱 Access Code: ${event.accessCode}`);
      console.log(`🔗 Use this access code to test face recognition`);
    } else {
      console.log('❌ Failed to create event');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

setupTestData();
