// availability.js Copyright 2020 Paul Beaudet MIT License
const {
  respond,
  _200,
  _400,
  parseBody,
  broadcastAll,
  send,
} = require('./gatewaySocketAdapter');
const { connectDB, updateDoc } = require('../db/mongo');

// lambda function for handling "GetAvail"
const GetAvail = async event => {
  const { connectionId } = event.requestContext;
  // -- look up if host is available in db -
  try {
    const { collection, client } = await connectDB('users');
    const findResult = await collection.findOne({
      email: process.env.HOST_EMAIL,
    });
    client.close();
    // no result give up
    if (!findResult) {
      return _400();
    }
    const { avail, connectionId: hostId } = findResult;
    // Respond to requesting client with host availability
    const sent = await respond(connectionId, 'AVAIL', { avail, hostId }, event);
    return sent ? _200(): _400();
  } catch (error) {
    console.log(error);
    return _400();
  }
};

const SetAvail = async event => {
  const { connectionId } = event.requestContext;
  const { avail } = parseBody(event.body);
  if (typeof avail === 'undefined') {
    console.log('No params to modify');
    return _400();
  }
  try {
    const { collection, client, db } = await connectDB('users');
    // keep in mind server only knows connectionId
    // and can relate it with the host
    const result = await collection.findOneAndUpdate(
      { connectionId },
      updateDoc({ avail })
    );
    if (!result) {
      client.close();
      console.log('not host or something');
      return _200();
    }
    const cast = await broadcastAll(connectionId, 'AVAIL', { avail }, event, db);
    client.close();
    return cast ? _200() : _400();
  } catch (error) {
    console.log(error);
    return _400();
  }
};

const EndCall = async event => {
  const { connectionId } = event.requestContext;
  const { collection, client } = await connectDB('users');
  const findResult = await collection.findOne({ $or: [{connectionId}, {matchId: connectionId}]});
  if(!findResult){
    client.close();
    return _200();
  }
  const {matchId: guestId, connectionId: hostId } = findResult
  let sent = null;
  if (hostId === connectionId){
    sent = await send(guestId, 'EndCall', {}, event);
  } else {
    sent = await send(hostId, 'EndCall', {}, event);
  }
  // update host if this would automatically set them to available
  // const updateResult = await collection.updateOne(
  //   {connectionId: hostId}, 
  //   updateDoc({matchId: '', avail: true})
  // );
  // if(!updateResult || !sent){
  //   client.close();
  //   return _200();
  // }
  // const cast = await broadcastAll(hostId, 'AVAIL', {avail: true}, event, db);
  client.close();
  return sent ? _200() : _400();
}

module.exports = {
  GetAvail,
  SetAvail,
  EndCall,
};
