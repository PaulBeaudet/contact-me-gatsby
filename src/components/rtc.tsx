// rtcClient.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useEffect, useContext, useState} from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
import { GlobalUserContext } from '../context/GlobalState';
import { configRTC, mediaConfig, offerConfig, videoState} from '../config/communication';
import { wsPayload } from '../interfaces/global';
import { getStream } from '../api/media';

const RTC: React.FC = () => {
  enum callState {
    setup,
    call,
    end,
    here,
    away,
  }
  const callStateText = [
    'Setup call',
    'Connect call',
    'End call',
    'Set as Available',
    'Set Away',
  ]
  const defaultVideoState = {width: 0, height: 0};
  const { state, dispatch } = useContext(GlobalUserContext);
  const [rtcPeer, setRtcPeer] = useState(null);
  const [matchId, setMatchId] = useState('');
  const [iceCandidates, setIceCandidates] = useState([]);
  const [candidatesFound, setCandidatesFound] = useState(false);
  const [stream, setStream] = useState(null);
  const [descriptionRemote, setDescriptionRemote ] = useState(false);
  const [remoteCandidates, setRemoteCandidates] = useState([]);
  const [callButtonState, setCallButtonState] = useState(callState.setup);
  const [videoWindowState, setVideoWindowState] = useState(defaultVideoState);
  const [muted, setMuted ] = useState(false);
  const [showVideo, setShowVideo ] = useState(mediaConfig.video);
  const { host, hostAvail, callInProgress } = state;
  
  // Remote ICE should only be added after a remote description is set
  useEffect(()=>{
    // keep in mind one candidate would be the terminating one anyhow
    if(descriptionRemote && remoteCandidates.length > 1){
      remoteCandidates.forEach(candidate => {
        rtcPeer.addIceCandidate(candidate);
      });
      setRemoteCandidates([]);
      setDescriptionRemote(false);
    }
  }, [descriptionRemote, remoteCandidates, rtcPeer])

  // Local ice should only be sent after a local description is set 
  // or more accurately when we know of the match id
  // In the guest case they've set local desc, 
  // but don't know who to send to until answer is received
  useEffect(()=>{
    if(matchId && candidatesFound && iceCandidates){
      wsSend('ice', { iceCandidates, matchId });
      // reset candidates found and ice candidates
      setCandidatesFound(false);
      setIceCandidates([]);
      setMatchId('');
    }
  }, [matchId, candidatesFound, iceCandidates]);

  // Effect on rtc peer creation
  useEffect(()=>{
    const offerResponse = async (sdp, match) => {
      rtcPeer.setRemoteDescription(sdp);
      setDescriptionRemote(true);
      setMatchId(match);
      try {
        const answer = await rtcPeer.createAnswer();
        await rtcPeer.setLocalDescription(answer);
        dispatch({
          type: 'CALL_PROGRESS',
          payload: {
            callInProgress: true,
          },
        });
        wsSend('answer', {sdp: answer, matchId: match})
        setCallButtonState(callState.end);
        setVideoWindowState(videoState);
      } catch (error){
        console.log(`offer response error: ${error}`);
      }
    };

    if(rtcPeer){
      wsOn('ice', (payload: wsPayload)=>{
        setRemoteCandidates(payload.iceCandidates);
      });
      wsOn('offer', (payload: wsPayload) => {
        offerResponse(payload.sdp, payload.matchId);
      });
      wsOn('answer', (payload: wsPayload)=>{
        rtcPeer.setRemoteDescription(payload.sdp);
        setDescriptionRemote(true);
        setMatchId(payload.matchId);
      });
      // What to do with ice candidates
      rtcPeer.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          // sure we're supposed to send them candidate by candidate
          // but thats a lot of lambda invocations
          iceCandidates.push(event.candidate);
          setIceCandidates(iceCandidates);
        }
      };
      rtcPeer.addEventListener('icegatheringstatechange', event => {
        if(rtcPeer.iceGatheringState === 'complete'){
          setCandidatesFound(true);
        }
      })
    } else if (typeof RTCPeerConnection !== 'undefined'){
      const rtcObj = new RTCPeerConnection(configRTC);
      setRtcPeer(rtcObj);
    }
  }, [rtcPeer]);

  const setUpMedia = async (rtcObj: RTCPeerConnection) => {
    let ourStream = stream;
    if(!ourStream){
      try {
        ourStream = await getStream();
        ourStream.getAudioTracks().forEach(track => {
          track.enabled = !muted;
        });
        if(mediaConfig.video){
          ourStream.getVideoTracks().forEach(track => {
            track.enabled = showVideo;
          });
        }
        setStream(ourStream);
      } catch (error){
        console.log(error);
        return;
      }
    }
    ourStream.getTracks().forEach(track => {
      rtcObj.addTrack(track, ourStream);
    });
    // On track needs to be called after getTracks or no candidates will be generated
    rtcObj.ontrack = (event) => {
      // Attach stream event to an html element <audio> or <video>
      if(typeof document !== 'undefined'){
        const element = document.getElementById('mediaStream') as HTMLVideoElement;
        element.srcObject = event.streams[0];
      }
    }
  };

  const connectCall = async () => {
    try {
      const description = await rtcPeer.createOffer(offerConfig);
      await rtcPeer.setLocalDescription(description);
      wsSend('offer', {sdp: rtcPeer.localDescription});
      dispatch({
        type: 'CALL_PROGRESS',
        payload: {
          callInProgress: true,
        },
      });
    } catch (error){
      console.log(`call failed: ${error}`);
    }
  }

  const endCall = () => {
    rtcPeer.close();
    setVideoWindowState(defaultVideoState);
    if(typeof document !== 'undefined'){
      const element = document.getElementById('mediaStream') as HTMLVideoElement | HTMLAudioElement;
      element.srcObject = null;
    }
    dispatch({
      type: 'CALL_PROGRESS',
      payload: {
        callInProgress: false,
      },
    });
    if (typeof RTCPeerConnection !== 'undefined'){
      const newRtc = new RTCPeerConnection(configRTC);
      setUpMedia(newRtc);
      setRtcPeer(newRtc);
    }
  }

  wsOn('EndCall', ()=> {
    endCall();
    setCallButtonState(host ? callState.here : callState.call);
  });

  const callButtonSwitch = () => {
    if(callButtonState === callState.setup){
      setUpMedia(rtcPeer);
      setCallButtonState(host ? callState.here : callState.call);
    } else if (callButtonState === callState.call){
      if (hostAvail && !callInProgress){
        connectCall();
        setCallButtonState(callState.end);
        setVideoWindowState(videoState);
      } else {
        console.log('connect button should probably be disabled');
      }
    } else if (callButtonState === callState.end){
      wsSend('EndCall');
      endCall();
      if(host){
        setCallButtonState(hostAvail ? callState.away : callState.here);
      } else {
        setCallButtonState(callState.call);
      }
    } else if (callButtonState === callState.here){
      wsSend('SetAvail', {avail: true});
      setCallButtonState(callState.away);
    } else if (callButtonState === callState.away){
      wsSend('SetAvail', {avail: false});
      setCallButtonState(callState.here);
    }
  }

  const muteToggle = () => {
    if(stream){
      stream.getAudioTracks().forEach(track => {
        track.enabled = muted
      });
    }
    setMuted(!muted);
  }

  const videoToggle = () => {
    if(stream){
      stream.getVideoTracks().forEach(track => {
        track.enabled = !showVideo
      });
    }
    setShowVideo(!showVideo);
  }

  // show elements when host is available or call is in progress
  const showingRtcElements: boolean = hostAvail || callInProgress || host;
  return (
    <>
      {showingRtcElements && <button onClick={callButtonSwitch} className="button">
        {callStateText[callButtonState]}
      </button>}
      {showingRtcElements && (
        <>
          <video id="mediaStream" autoPlay={true} width={videoWindowState.height} height={videoWindowState.width} playsInline>
            unsupported
          </video>
          <button onClick={muteToggle} className="button">
            {muted ? 'unmute' : 'mute'}
          </button>
          {mediaConfig.video && <button onClick={videoToggle} className="button">
            {showVideo ? 'hide video' : 'share video'}
          </button>}
        </>
      )}
    </>
  );
}; // end of RTC function

export default RTC;