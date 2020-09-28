// WebRTC.ts Copyright 2020
import { wsOn, wsSend } from './WebSocket';

const configRTC = {
  iceServers: [
    { urls: process.env.GATSBY_ICE_SERVER_1 },
    { urls: process.env.GATSBY_ICE_SERVER_2 },
  ],
};

const offerConfig = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: false,
};

// What to do with ice candidates
const onIce = (iceCandidates, matchId: string) => {
  return event => {
    // on address info being introspected (after local description is set)
    if (event.candidate) {
      // candidate property denotes data as multiple candidates can resolve
      iceCandidates.push(event.candidate);
    } else {
      // Absence of a candidate means a finished exchange
      // Send ice candidates to match once we have them all
      wsSend('ice', { iceCandidates, matchId });
      // empty candidates once they are sent
      iceCandidates = [];
    }
  };
};

const createRTC = async (matchId: string, stream = null) => {
  // verify media stream before calling
  const peerConnection = new RTCPeerConnection(configRTC);
  // create new instance for local client
  if (stream) {
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
    // behavior upon receiving track
    peerConnection.ontrack = event => {
      console.dir(event);
      // Attach stream event to an html element <audio> or <video>
      // document.getElementById('mediaStream').srcObject = event.streams[0];
    };
  }
  // Handle ice candidate at any random time they decide to come
  let iceCandidates = [];
  peerConnection.onicecandidate = onIce(iceCandidates, matchId);
  return peerConnection;
};

// Creates a websocket handler for "ice" event
const iceHandler = peerConnection => {
  return payload => {
    const { iceCandidates: matchCandidates } = payload;
    matchCandidates.forEach(candidate => {
      peerConnection.addIceCandidate(candidate);
    });
  };
};

// makes an offer to connect
const createOffer = async matchId => {
  try {
    const peerConnection = await createRTC(matchId);
    // assign a handler to addressing handshake
    wsOn('ice', iceHandler(peerConnection));
    // Respond if host answers our offer
    wsOn('answer', payload => {
      peerConnection.setRemoteDescription(payload.sdp);
    });
    const description = await peerConnection.createOffer(offerConfig);
    await peerConnection.setLocalDescription(description);
    wsSend('offer', { sdp: peerConnection.localDescription });
  } catch (error) {
    console.log(`issue creating offer: ${error}`);
  }
};

// Creates a websocket handler for "offer" event
const offerResponse = async payload => {
  try {
    const { sdp, matchId } = payload;
    const peerConnection = await createRTC(matchId);
    wsOn('ice', iceHandler(peerConnection));
    peerConnection.setRemoteDescription(sdp);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    // send selves sdp in response to theirs
    wsSend('answer', { sdp: answer, matchId });
  } catch (error) {
    console.log(`issue responding to offer: ${error}`);
  }
};

export { createOffer, offerResponse };
