// gateway.js ~ Copyright 2019-2020 Paul Beaudet
const { mongo } = require('../db/mongo');
const { _200 } = require('./gatewaySocketAdapter');

// This is where we manage our socket connections persistently in our database
const gatewayWSS = {
  connect: async event => {
    const { connectionId } = event.requestContext;
    // the only way to make the database call without caring about the result
    // is to call mongo.insertOne({...}) without await,
    // without logging any part of the result
    try {
      const result = await mongo.insertOne({ connectionId });
      console.log(`${result.insertedCount}: connection added`);
    } catch (error) {
      console.dir(error);
    }
    return _200();
  },
  disconnect: async event => {
    const { connectionId } = event.requestContext;
    try {
      const result = await mongo.deleteOne({ connectionId });
      console.log(`${result.deletedCount}: connection deleted`);
    } catch (error) {
      console.dir(error);
    }
    return _200();
  },
  default: async event => {
    console.log(event);
    return _200({ message: 'nope' });
  },
};

module.exports = gatewayWSS;
