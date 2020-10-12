// WebRTCClient.ts Copyright 2020 Paul Beaudet MIT License
import { configRTC, mediaConfig, offerConfig } from '../config/communication';
import { wsPayload } from '../interfaces/global';

// figure the type of element that is being used for this application
// Assign it before more than one connection might be made
let attachElement = {srcObject: null};
if (typeof document !== 'undefined') {
  attachElement = mediaConfig.video
    ? <HTMLVideoElement>document.getElementById('mediaStream')
    : <HTMLAudioElement>document.getElementById('mediaStream');
}

class rtcConnection {
  matchId: string;
  iceCandidates: Array<any>;
  rtcPeer: RTCPeerConnection;
  onMatchAndIce: () => void;
  constructor() {
    if(typeof RTCPeerConnection !== 'undefined'){
      this.matchId = '';
      this.rtcPeer = new RTCPeerConnection(configRTC);
      this.rtcPeer.ontrack = event => {
        attachElement.srcObject = event.streams[0];
      };
      this.iceCandidates = [];
      this.onMatchAndIce = ()=>{};
      this.rtcPeer.onicecandidate = this.getLocalIce.bind(this);
      this.rtcPeer.onconnectionstatechange = event => {
        console.log(`rtc state: ${event}`)
      };
    } 
  }
  attachMedia(mediaStream: MediaStream){
    mediaStream.getTracks().forEach(track => {
      this.rtcPeer.addTrack(track);
    });
  }
  getLocalIce(event: RTCPeerConnectionIceEvent){
    // on address info being introspected (after local description is set)
    if (event.candidate) {
      // candidate property denotes data as multiple candidates can resolve
      this.iceCandidates.push(event.candidate);
    } else {
      // Absence of a candidate means a finished exchange
      // Send ice candidates to match once we have them all
      if (this.matchId) {
        this.onMatchAndIce();
      } else {
        // Call again until this.matchId resolves
        setTimeout(() => {
          this.getLocalIce(event);
        }, 50);
      }
    }
  };
  getRemoteIce(payload: wsPayload){
    const { iceCandidates: matchCandidates } = payload;
    matchCandidates.forEach((candidate: RTCIceCandidate) => {
      this.rtcPeer.addIceCandidate(candidate);
    });
  }
  async createOffer() {
    try {
      const description = await this.rtcPeer.createOffer(offerConfig);
      await this.rtcPeer.setLocalDescription(description);
      return { sdp: this.rtcPeer.localDescription };
    } catch (error) {
      throw new Error(`issue creating offer: ${error}`);
    }
  }
  receiveAnswer(payload: wsPayload){
    this.matchId = payload.matchId;
    this.rtcPeer.setRemoteDescription(payload.sdp);
  }
  async offerResponse(payload: wsPayload) {
    try {
      const { sdp, matchId: ourMatch } = payload;
      this.matchId = ourMatch;
      this.rtcPeer.setRemoteDescription(sdp);
      const answer = await this.rtcPeer.createAnswer();
      await this.rtcPeer.setLocalDescription(answer);
      return { sdp: answer, matchId: this.matchId };
    } catch (error) {
      throw new Error(`issue responding to offer: ${error}`);
    }
  }
}

export { rtcConnection };