// WebRTC.ts Copyright 2020 Paul Beaudet MIT License
import { wsOn, wsSend } from './WebSocket';
import { configRTC, mediaConfig, offerConfig } from '../config/communication';
import { getStream } from './media';
import { wsPayload } from '../interfaces/global';

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

// Creates a websocket handler for "ice" event
const iceHandler = (peerConnection: RTCPeerConnection) => {
  return (payload: wsPayload) => {
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
    wsOn('answer', (payload: wsPayload) => {
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
      const attachElement = mediaConfig.video
        ? <HTMLVideoElement>document.getElementById('mediaStream')
        : <HTMLAudioElement>document.getElementById('mediaStream');
      if (typeof document !== 'undefined') {
        attachElement.srcObject = event.streams[0];
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

// Creates a websocket handler for "offer" event
const offerResponse = async (payload: wsPayload) => {
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


export { offerResponse, createOffer };
