// availability.js Copyright 2020 Paul Beaudet MIT License
const { respond, _200 } = require('./gatewaySocketAdapter');
// require('../db/mongo');

// lambda function for handling "GetAvail"
const GetAvail = async event => {
  // -- look up if host is available in db --
  // -- Send event --
  const { connectionId } = event.requestContext;
  respond(connectionId, 'AVAIL', { avail: false }, event);
  return _200();
};
// responds with "AVAIL"

module.exports.GetAvail = GetAvail;
