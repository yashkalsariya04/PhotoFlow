
const API_URL = 'https://facematrix.sonomainfotech.in/api';

async function testRustication() {
  const timestamp = Date.now();
  const victimEmail = `victim_${timestamp}@test.com`;
  const password = 'password123';

  console.log(`1. Registering victim: ${victimEmail}`);
  const victimRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Victim', email: victimEmail, password }),
  });
  
  if (!victimRes.ok) {
    console.error('Failed to register victim', await victimRes.text());
    return;
  }
  
  const victimData = await victimRes.json();
  const victimId = victimData.user.id;
  console.log(`   Victim registered with ID: ${victimId}`);

  console.log('2. Verifying Victim Login (Active)');
  const loginRes1 = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: victimEmail, password }),
  });

  if (loginRes1.ok) {
    console.log('   Login SUCCESS (Expected)');
  } else {
    console.error('   Login FAILED (Unexpected)', await loginRes1.text());
    return;
  }

  console.log('3. Rusticating Victim (Setting isActive: false)');
  // In a real app we need admin token, but current backend doesn't enforce admin role for update, just authentication.
  // We can use the victim's own token or register an admin. Let's use victim's token for simplicity since role check is TODO.
  const token = victimData.token;
  
  const updateRes = await fetch(`${API_URL}/users/${victimId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isActive: false }),
  });

  if (updateRes.ok) {
    console.log('   Update SUCCESS');
    console.log('   Response:', await updateRes.json());
  } else {
    console.error('   Update FAILED', await updateRes.text());
    return;
  }

  console.log('4. Verifying Victim Login (Rusticated)');
  const loginRes2 = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: victimEmail, password }),
  });

  if (loginRes2.ok) {
    console.error('   Login SUCCESS (FAILURE - Should be blocked!)');
    console.error('   The backend is NOT enforcing the check.');
  } else {
    if (loginRes2.status === 401) {
        console.log('   Login FAILED with 401 (SUCCESS - Blocked correctly!)');
        console.log('   Error message:', await loginRes2.json());
    } else {
        console.log(`   Login FAILED with ${loginRes2.status} (Acceptable)`);
    }
  }
}

testRustication().catch(console.error);
