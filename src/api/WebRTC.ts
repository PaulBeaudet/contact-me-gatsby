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

// class rtcConnection {
//   constructor(mediaStream) {
//     this.matchId = '';
//     this.rtcPeer = new RTCPeerConnection(configRTC);
//     this.iceCandidates = [];
//     mediaStream.getTracks().forEach(track => {
//       console.log('add tracks');
//       this.rtcPeer.addTrack(track);
//     });
//     this.rtcPeer.ontrack = event => {
//       if (typeof document !== 'undefined') {
//         console.log('attaching media stream to html element');
//         document.getElementById('mediaStream').srcObject = event.streams[0];
//       }
//     };
//     const getLocalIce = event => {
//       // on address info being introspected (after local description is set)
//       if (event.candidate) {
//         // candidate property denotes data as multiple candidates can resolve
//         this.iceCandidates.push(event.candidate);
//       } else {
//         // Absence of a candidate means a finished exchange
//         // Send ice candidates to match once we have them all
//         if (this.matchId) {
//           console.log(`sending ice candidates to ${this.matchId}`);
//           wsSend('ice', {
//             iceCandidates: this.iceCandidates,
//             matchId: this.matchId,
//           });
//         } else {
//           // Call again until this.matchId resolves
//           setTimeout(() => {
//             getLocalIce(event);
//           }, 50);
//         }
//       }
//     };
//     this.rtcPeer.onicecandidate = getLocalIce;
//     const getRemoteIce = payload => {
//       const { iceCandidates: matchCandidates } = payload;
//       console.log(`adding candidates`);
//       matchCandidates.forEach(candidate => {
//         this.rtcPeer.addIceCandidate(candidate);
//       });
//     };
//     wsOn('ice', getRemoteIce);
//   }
//   async createOffer() {
//     wsOn('answer', payload => {
//       this.matchId = payload.matchId;
//       this.rtcPeer.setRemoteDescription(payload.sdp);
//     });
//     try {
//       // Respond if host answers our offer
//       const description = await this.rtcPeer.createOffer(offerConfig);
//       await this.rtcPeer.setLocalDescription(description);
//       wsSend('offer', { sdp: this.rtcPeer.localDescription });
//     } catch (error) {
//       console.log(`issue creating offer: ${error}`);
//     }
//   }
//   async offerResponse(payload) {
//     try {
//       const { sdp, matchId: ourMatch } = payload;
//       this.matchId = ourMatch;
//       this.rtcPeer.setRemoteDescription(sdp);
//       const answer = await this.rtcPeer.createAnswer();
//       await this.rtcPeer.setLocalDescription(answer);
//       // send selves sdp in response to theirs
//       wsSend('answer', { sdp: answer, matchId: this.matchId });
//     } catch (error) {
//       console.log(`issue responding to offer: ${error}`);
//     }
//   }
// }

// const onIce = event => {
//   // on address info being introspected (after local description is set)
//   if (event.candidate) {
//     // candidate property denotes data as multiple candidates can resolve
//     this.iceCandidates.push(event.candidate);
//   } else {
//     // Absence of a candidate means a finished exchange
//     // Send ice candidates to match once we have them all
//     if (this.matchId) {
//       console.log(`sending ice candidates to ${this.matchId}`);
//       wsSend('ice', {
//         iceCandidates: this.iceCandidates,
//         matchId: this.matchId,
//       });
//     } else {
//       // Call again until this.matchId resolves
//       setTimeout(() => {
//         onIce(event);
//       }, 50);
//     }
//   }
// };

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

// export { rtcConnection };
export { offerResponse, createOffer };
