// management.js Copyright 2020 Paul Beaudet MIT License
const { connectDB, updateDoc } = require('./mongo');
const { broadcastAll, _400, _200 } = require('../api/gatewaySocketAdapter');

// should run on monolith shut-down
// setting this up so that it could be called as a lambda util
const startFresh = async event => {
  try {
    const { collection, client, db } = await connectDB('users');
    // update host to be unavailable
    const filter = { email: process.env.HOST_EMAIL };
    const update = updateDoc({ connectionId: '', avail: false });
    const updateResult = await collection.updateOne(filter, update);
    if (updateResult && updateResult.modifiedCount) {
      // Let other clients know that host is offline
      broadcastAll('', 'AVAIL', { avail: false, hostId: '' }, event, db);
      console.log(`host updated to unavailable`);
    }
    // Drop socket pool
    const cursor = db.listCollections({});
    // check if socket pool exist
    await cursor.forEach(async col => {
      if (col.name === 'socketPool') {
        await db.collection('socketPool').drop();
      }
    });
    client.close();
    return _200();
  } catch (error) {
    console.log(`issue with cleanup process ${error}`);
    return _400();
  }
};

module.exports = {
  startFresh,
};
