// gateway.js ~ Copyright 2019-2020 Paul Beaudet
const { connectDB, insertDoc, updateDoc } = require('../db/mongo');
const { _200, _400, broadcast } = require('./gatewaySocketAdapter');

// Add socket connections persistently in our database
const connect = async event => {
  const { connectionId } = event.requestContext;
  try {
    const { collection, client } = await connectDB();
    const result = await collection.insertOne(insertDoc({ connectionId }));
    console.log(`${result.insertedCount}: connection added`);
    client.close();
    return _200();
  } catch (error) {
    console.dir(error);
    return _400();
  }
};

// Remove socket connections from our database
const disconnect = async event => {
  const { connectionId } = event.requestContext;
  try {
    const { collection, client, db } = await connectDB();
    // delete this result without waiting for a confirmation
    collection.deleteOne({ connectionId });
    // check if this is the host disconnecting
    const usersCollection = db.collection('users');
    const filter = { connectionId };
    const update = updateDoc({ connectionId: '', avail: false });
    const updateResult = await usersCollection.updateOne(filter, update);
    if (updateResult && updateResult.modifiedCount) {
      // Let other clients know that host is offline
      broadcast(connectionId, 'AVAIL', { avail: false, hostId: '' }, event, db);
      console.log(`host updated to unavailable`);
    }
    client.close();
    return _200();
  } catch (error) {
    console.dir(error);
    return _400();
  }
};

const defaultLambda = async event => {
  console.log(event);
  return _200({ message: 'nope' });
};

module.exports = {
  default: defaultLambda,
  disconnect,
  connect,
};
