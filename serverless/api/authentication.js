// authentication.js Copyright 2020 Paul Beaudet MIT License
const {
  respond,
  _200,
  parseBody,
  _400,
  broadcastAll,
} = require('./gatewaySocketAdapter');
const { connectDB, updateDoc } = require('../db/mongo');
const bcrypt = require('bcryptjs');

// lambda function for handling "login"
const login = async event => {
  // -- look up if user is in db --
  const { connectionId } = event.requestContext;
  const data = parseBody(event.body);
  if (!data) {
    console.log(`login: No body!`);
    return _400();
  }
  const { email, password, lastSession, thisSession } = data;
  try {
    const { collection, client } = await connectDB('users');
    const findResult = await collection.findOne({ email });
    if (!findResult) {
      console.log('could not find host?');
      return _400();
    }
    const { passHash, sessionHash } = findResult;
    if (password && passHash) {
      const compare = await bcrypt.compare(password, passHash);
      if (!compare) {
        client.close();
        console.log('password hash no match');
        await respond(connectionId, 'reject', {}, event);
        return _200();
      }
    } else if (lastSession && sessionHash) {
      // or a valid last session information
      // const clientCompare = await bcrypt.compare(clientOid, clientHash);
      const sessionCompare = await bcrypt.compare(lastSession, sessionHash);
      if (!sessionCompare) {
        client.close();
        console.log('session hash no match');
        await respond(connectionId, 'reject', {}, event);
        return _200();
      }
    } else {
      console.log('invalid pass creds or no creds in db');
      client.close();
      await respond(connectionId, 'reject', {}, event);
      return _200();
    }
    // broadcast availability to other clients given password checks out
    // let user know they are logged in
    const sent = await respond(connectionId, 'login', {}, event);
    if(!sent){
      client.close();
      console.log('could not respond to client');
      return _200();
    }
    // update user in database
    const filter = { email };
    // hash session id that can be logged in with next session
    const salt = bcrypt.genSaltSync(10);
    const hashSession = bcrypt.hashSync(thisSession, salt);
    const update = updateDoc({
      connectionId,
      sessionHash: hashSession,
    });
    const updateResult = await collection.updateOne(filter, update);
    if (updateResult && updateResult.modifiedCount) {
      console.log(`${email} successfully logged in`);
      client.close();
      return _200();
    }
  } catch (error) {
    console.log(error);
    return _400();
  }
};
// responds to all clients with availability if successful

const logout = async event => {
  const { connectionId } = event.requestContext;
  try {
    const { collection, client, db } = await connectDB('users');
    // keep in mind server only knows connectionId
    // and can relate it with the host
    const result = await collection.findOneAndUpdate(
      { connectionId },
      updateDoc({
        avail: false,
        connectionId: '',
        sessionHash: '',
      })
    );
    if (!result) {
      client.close();
      console.log('not host or something');
      return _200();
    }
    await broadcastAll(connectionId, 'AVAIL', { avail: false }, event, db);
    client.close();
    return _200();
  } catch (error) {
    console.log(error);
    return _400();
  }
};

module.exports = {
  login,
  logout,
};
