// WebRTC.ts Copyright 2020 Paul Beaudet MIT License
import { wsOn, wsSend } from './WebSocket';
import { getStream } from './media';

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

let matchId = '';

// What to do with ice candidates
const onIce = iceCandidates => {
  return event => {
    // on address info being introspected (after local description is set)
    if (event.candidate) {
      // candidate property denotes data as multiple candidates can resolve
      iceCandidates.push(event.candidate);
    } else {
      // Absence of a candidate means a finished exchange
      // Send ice candidates to match once we have them all
      if (matchId) {
        console.log(`sending ice candidates to ${matchId}`);
        wsSend('ice', { iceCandidates, matchId });
        // empty candidates once they are sent
        iceCandidates = [];
      } else {
        setTimeout(() => {
          onIce(iceCandidates)(event);
        }, 50);
      }
    }
  };
};

const createRTC = async () => {
  // verify media stream before calling
  const peerConnection = new RTCPeerConnection(configRTC);
  // create new instance for local client
  try {
    const mediaStream = await getStream();
    if (!mediaStream) {
      throw new Error(`no media stream`);
    }
    mediaStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, mediaStream);
    });
    // behavior upon receiving track
    peerConnection.ontrack = event => {
      // Attach stream event to an html element <audio> or <video>
      if (typeof document !== 'undefined') {
        document.getElementById('mediaStream').srcObject = event.streams[0];
      }
    };
  } catch (error) {
    console.log(`createRTC, issue with stream: ${error}`);
  }
  // Handle ice candidate at any random time they decide to come
  let iceCandidates = [];
  peerConnection.onicecandidate = onIce(iceCandidates);
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
const createOffer = async () => {
  try {
    const peerConnection = await createRTC();
    // assign a handler to addressing handshake
    wsOn('ice', iceHandler(peerConnection));
    // Respond if host answers our offer
    wsOn('answer', payload => {
      matchId = payload.matchId;
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
    const { sdp, matchId: ourMatch } = payload;
    matchId = ourMatch;
    console.log(`receiving offer from ${matchId}`);
    const peerConnection = await createRTC();
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
