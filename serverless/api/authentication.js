// authentication.js Copyright 2020 Paul Beaudet MIT License
const {
  respond,
  _200,
  parseBody,
  _400,
  broadcastAll,
} = require('./gatewaySocketAdapter');
const { findOne } = require('../db/mongo');
const bcrypt = require('bcryptjs');

// lambda function for handling "login"
const login = async event => {
  // -- look up if user is in db --
  const { connectionId } = event.requestContext;
  const data = parseBody(event);
  if (!data) {
    return _400();
  }
  console.dir(data);
  const { email, password } = data;
  try {
    const result = await findOne({ email });
    if (!result) {
      return _400();
    }
    const { passHash, username } = result;
    const compare = await bcrypt.compare(password, passHash);
    console.dir(compare);
    if (!compare) {
      return _200();
    }
    // broadcast availability to other clients given password checks out
    broadcastAll(connectionId, 'AVAIL', { avail: true }, event);
    // let user know they are logged in
    respond(connectionId, 'login', { email, username }, event);
  } catch (error) {
    console.log(error);
  }
  // -- Send event --

  return _200();
};
// responds to all clients with availability if successful

module.exports.login = login;
