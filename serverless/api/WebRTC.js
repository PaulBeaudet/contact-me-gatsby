// WebRTC.js Copyright 2020 Paul Beaudet MIT License
const { connectDB } = require('../db/mongo');
const { parseBody, _400, send, _200 } = require('./gatewaySocketAdapter');

// lambda for exchanging ice candidates
// Internet Connectivity Establishment (ICE)
// This is the exchange of contact address information
const ice = async event => {
  const body = parseBody(event.body);
  if (!body) {
    return _400();
  }
  const { iceCandidates, matchId } = body;
  if (!iceCandidates || !matchId) {
    return _400();
  }
  send(matchId, 'ice', { iceCandidates }, event);
  return _200();
};

// lambda for making WebRTC offers to another user
// In the case of this implementation guest makes offer
// on seeing host availability.
// The offer initializes the exchange of SDP describing
// how clients will talk to each other.
const offer = async event => {
  const body = parseBody(event.body);
  if (!body) {
    console.log(`offer: No body!`);
    return _400();
  }
  const { sdp } = body;
  // Make sure Session Description Protocol (SDP) data exist
  // It will need to be offered to the host
  if (!sdp) {
    console.log(`No sdp data`);
    return _400();
  }
  // Rename this guest's connectionId to guestId
  const { connectionId: guestId } = event.requestContext;
  // look up host id in db
  try {
    const { collection, client } = await connectDB('users');
    const findResult = await collection.findOne({
      email: process.env.HOST_EMAIL,
    });
    // Something went wrong if the host isn't in the db
    if (!findResult) {
      console.log(`could not find host on offer`);
      client.close();
      return _400();
    }
    // Rename host's connectionId to hostId
    const { connectionId: hostId } = findResult;
    // no host id would mean host is unavailable (Rouge Client?)
    if (!hostId) {
      console.log(`did not get host id from db`);
      client.close();
      return _400();
    }
    // Send this offer to the host from the guest
    send(hostId, 'offer', { sdp, matchId: guestId }, event);
    console.log(`sent offer to ${hostId}`);
    client.close();
    return _200();
  } catch (error) {
    console.log(`Issue with offer: ${error}`);
  }
};

// lambda for answering WebRTC calls from another user.
// In the case of this implementation host answers guest.
// This completes the exchange of how clients will talk P2P
// as described by exchanged SDP data.
const answer = async event => {
  const body = parseBody(event.body);
  if (!body) {
    return _400();
  }
  const { sdp, matchId: guestId } = body;
  // SDP needs to be exchanged
  // & host needs to know who to respond to
  if (!sdp || !guestId) {
    return _400();
  }
  const { connectionId: hostId } = event.requestContext;
  send(guestId, 'answer', { sdp, matchId: hostId }, event);
  return _200();
};

module.exports = {
  ice,
  offer,
  answer,
};
