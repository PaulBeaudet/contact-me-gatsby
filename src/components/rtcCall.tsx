// rtcCall.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useEffect, useContext, useState} from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
import { GlobalUserContext } from '../context/GlobalState';
import { configRTC, offerConfig, videoState} from '../config/communication';
import { wsPayload } from '../interfaces/global';
import MediaWindow from './mediaWindow';

const RTCCall: React.FC = () => {
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
  const [descriptionRemote, setDescriptionRemote ] = useState(false);
  const [remoteCandidates, setRemoteCandidates] = useState([]);
  const [callButtonState, setCallButtonState] = useState(callState.setup);
  const [videoWindowState, setVideoWindowState] = useState(defaultVideoState);
  const [requestSetup, setRequestSetup] = useState(0);
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
      const element = document.getElementById('remoteStream') as HTMLVideoElement | HTMLAudioElement;
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
      setRequestSetup(requestSetup + 1);
      setRtcPeer(newRtc);
    }
  }

  wsOn('EndCall', ()=> {
    endCall();
    setCallButtonState(host ? callState.here : callState.call);
  });

  const callButtonSwitch = () => {
    if(callButtonState === callState.setup){
      setRequestSetup(requestSetup + 1);
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

  // show elements when host is available or call is in progress
  const showingRtcElements: boolean = hostAvail || callInProgress || host;
  return (
    <>
      {showingRtcElements && <button onClick={callButtonSwitch} className="button">
        {callStateText[callButtonState]}
      </button>}
      {showingRtcElements && (
        <MediaWindow rtcObj={rtcPeer} videoWindowState={videoWindowState} requestSetup={requestSetup}/>
      )}
    </>
  );
}; // end of RTC function

export default RTCCall;