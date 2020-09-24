// gateway.js ~ Copyright 2019-2020 Paul Beaudet
const Responses = require('./API_Response');
const { mongo } = require('../db/mongo');

// This is where we manage our socket connections persistently in our database
const gatewayWSS = {
  connect: async event => {
    const { connectionId } = event.requestContext;
    const result = await mongo.insertOne({ connectionId }).catch(console.dir);
    console.log(`${result.insertedCount}: connection added`);
    return result;
  },
  disconnect: async event => {
    const { connectionId } = event.requestContext;
    const result = await mongo
      .deleteOne({
        connectionId,
      })
      .catch(console.log);
    console.log(`${result.deletedCount}: connection deleted`);
    return result;
  },
  default: async event => {
    console.log(event);
    return Responses._400({ message: 'nope' });
  },
};

module.exports = gatewayWSS;
