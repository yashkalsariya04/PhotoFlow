const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createValidTestImages() {
  console.log('🎨 Creating valid JPEG test images...');
  
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const testImages = [
    { name: 'test-photo-1.jpg', color: { r: 255, g: 0, b: 0 }, description: 'Red photo' },
    { name: 'test-photo-2.jpg', color: { r: 0, g: 255, b: 0 }, description: 'Green photo' },
    { name: 'test-photo-3.jpg', color: { r: 0, g: 0, b: 255 }, description: 'Blue photo' },
    { name: 'test-photo-4.jpg', color: { r: 255, g: 255, b: 0 }, description: 'Yellow photo' },
    { name: 'test-photo-5.jpg', color: { r: 255, g: 0, b: 255 }, description: 'Magenta photo' }
  ];
  
  for (const img of testImages) {
    try {
      // Create a 200x200 solid color image using Sharp
      await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: img.color.r, g: img.color.g, b: img.color.b }
        }
      })
      .jpeg({ quality: 80 })
      .toFile(path.join(uploadsDir, img.name));
      
      console.log(`✅ Created ${img.description}: ${img.name}`);
    } catch (error) {
      console.log(`❌ Failed to create ${img.description}:`, error.message);
    }
  }
  
  console.log('\n🎉 Test images created successfully!');
  console.log('📁 Location: backend/uploads/');
}

createValidTestImages();
