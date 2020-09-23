// gateway.js ~ Copyright 2019-2020 Paul Beaudet
const Responses = require('./API_Response');
const { mongo } = require('../dbAbstractions/mongo');

const gatewayWSS = {
  connect: async event => {
    const { connectionId } = event.requestContext;
    const result = await mongo.insertOne({ connectionId }).catch(console.dir);
    console.log(`result: ${result.insertedCount}`);
  },
  disconnect: async event => {
    console.log(event);
    return Responses._200({ message: 'disconnected' });
  },
  default: async event => {
    console.log(event);
    return Responses._200({ message: 'yup' });
  },
};

module.exports = gatewayWSS;
