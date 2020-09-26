// gateway.js ~ Copyright 2019-2020 Paul Beaudet
const { insertOne, deleteOne, updateOne } = require('../db/mongo');
const { _200, _400, broadcast } = require('./gatewaySocketAdapter');

// This is where we manage our socket connections persistently in our database
const gatewayWSS = {
  connect: async event => {
    const { connectionId } = event.requestContext;
    // the only way to make the database call without caring about the result
    // is to call insertOne({...}) without await,
    // without logging any part of the result
    try {
      const result = await insertOne({ connectionId });
      console.log(`${result.insertedCount}: connection added`);
    } catch (error) {
      console.dir(error);
    }
    return _200();
  },
  disconnect: async event => {
    const { connectionId } = event.requestContext;
    try {
      deleteOne({ connectionId });
      // check if this is the host disconnecting
      const updateResult = await updateOne(
        { connectionId },
        { connectionId: '', avail: false }
      );
      if (updateResult && updateResult.modifiedCount) {
        // Let other clients know that host is offline
        broadcast(connectionId, 'AVAIL', { avail: false }, event);
        console.log(`host updated to unavailable`);
      }
      return _200();
    } catch (error) {
      console.dir(error);
      return _400();
    }
  },
  default: async event => {
    console.log(event);
    return _200({ message: 'nope' });
  },
};

module.exports = gatewayWSS;
