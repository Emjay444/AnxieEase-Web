import deviceService from './src/services/deviceService.js';

// Test the device service
console.log('Testing Device Service...');

async function testDeviceService() {
  try {
    console.log('1. Testing getDeviceStatus...');
    const status = await deviceService.getDeviceStatus();
    console.log('Device Status:', JSON.stringify(status, null, 2));

    console.log('\n2. Testing getAvailableUsers...');
    const users = await deviceService.getAvailableUsers();
    console.log('Available Users:', JSON.stringify(users, null, 2));

    console.log('\nDevice service test completed successfully!');
  } catch (error) {
    console.error('Error testing device service:', error);
  }
}

testDeviceService();