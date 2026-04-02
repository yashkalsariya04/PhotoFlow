
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:3001/api';
const EMAIL = 'yashkalsaria040@gmail.com';
const PASSWORD = 'password';

async function run() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginResp = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    const token = loginResp.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    // 2. Update Profile
    console.log('Updating profile...');
    const form = new FormData();
    form.append('name', 'Updated Name Test');
    form.append('designation', 'Test Designation');
    form.append('location', 'Test Location');
    
    // Optional: Add a dummy file if needed, but testing text fields first
    // form.append('avatar', fs.createReadStream(__filename)); 

    const updateResp = await axios.put(`${API_URL}/users/profile`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Update Response:', updateResp.data);

    // 3. Verify
    if (updateResp.data.name === 'Updated Name Test') {
      console.log('✅ Name updated successfully!');
    } else {
      console.log('❌ Name did not update. Expected "Updated Name Test", got:', updateResp.data.name);
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

run();
