const { MongoMemoryServer } = require('mongodb-memory-server');

async function test() {
  try {
    console.log('Starting MongoMemoryServer...');
    const mongod = await MongoMemoryServer.create({
        binary: {
            version: '6.0.15',
            checkMD5: true,
        },
    });
    console.log('MongoMemoryServer started:', mongod.getUri());
    await mongod.stop();
  } catch (err) {
    console.error('Failed to start MongoMemoryServer:', err);
  }
}

test();
