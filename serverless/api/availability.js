// availability.js Copyright 2020 Paul Beaudet MIT License
// require('./socket');
// require('../db/mongo');

// lambda function for handling "GetAvail"
const GetAvail = async event => {
  // -- look up if host is available in db --
  // -- Send event --
  // NOTE: this wont work in lambda
  // Need to re-think how socket.send works to use promises instead of callbacks
  event.deabute.responseFunc('AVAIL', { avail: false });
  return;
};
// responds with "AVAIL"

module.exports.GetAvail = GetAvail;
