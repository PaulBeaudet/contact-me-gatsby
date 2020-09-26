// authentication.js Copyright 2020 Paul Beaudet MIT License
const {
  respond,
  _200,
  parseBody,
  _400,
  broadcastAll,
} = require('./gatewaySocketAdapter');
const { findOne, updateOne } = require('../db/mongo');
const bcrypt = require('bcryptjs');

// lambda function for handling "login"
const login = async event => {
  // -- look up if user is in db --
  const { connectionId } = event.requestContext;
  const data = parseBody(event);
  if (!data) {
    return _400();
  }
  const { email, password } = data;
  try {
    const findResult = await findOne({ email });
    if (!findResult) {
      return _400();
    }
    const { passHash, username } = findResult;
    const compare = await bcrypt.compare(password, passHash);
    if (!compare) {
      return _200();
    }
    // broadcast availability to other clients given password checks out
    broadcastAll(connectionId, 'AVAIL', { avail: true }, event);
    // let user know they are logged in
    respond(connectionId, 'login', { email, username, connectionId }, event);
    // update user in database
    const updateResult = await updateOne(
      { email },
      { connectionId, avail: true }
    );
    if (updateResult && updateResult.modifiedCount) {
      console.log(`${email} successfully logged in`);
      return _200();
    }
  } catch (error) {
    console.log(error);
    return _400();
  }
};
// responds to all clients with availability if successful

module.exports.login = login;
