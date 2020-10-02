// availability.js Copyright 2020 Paul Beaudet MIT License
const { respond, _200, _400 } = require('./gatewaySocketAdapter');
const { connectDB } = require('../db/mongo');

// lambda function for handling "GetAvail"
const GetAvail = async event => {
  const { connectionId } = event.requestContext;
  // -- look up if host is available in db -
  try {
    const { collection, client } = await connectDB('users');
    const findResult = await collection.findOne({
      email: process.env.HOST_EMAIL,
    });
    // no result give up
    if (!findResult) {
      client.close();
      return _400();
    }
    const { avail, connectionId: hostId } = findResult;
    // Respond to requesting client with host availability
    respond(connectionId, 'AVAIL', { avail, hostId }, event);
    client.close();
    return _200();
  } catch (error) {
    console.log(error);
    return _400();
  }
};
// responds with "AVAIL"

module.exports.GetAvail = GetAvail;
