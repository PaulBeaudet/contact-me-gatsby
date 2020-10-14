// rtcClient.tsx Copyright 2020 Paul Beaudet MIT Licence
// Working rtc component
import React, { useEffect, useContext, useState} from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
import { GlobalUserContext } from '../context/GlobalState';
import { mediaConfig, configRTC, offerConfig} from '../config/communication';
import { wsPayload } from '../interfaces/global';
import { getStream } from '../api/media';

const RTC = () => {
  enum callState {
    setup,
    call,
    end,
  }
  const callStateText = [
    'Setup call',
    'Connect call',
    'End call',
  ]
  const hostCallState = [...callStateText];
  hostCallState[callState.call] = 'Change Availability'
  const { state, dispatch } = useContext(GlobalUserContext);
  const [rtcPeer, setRtcPeer] = useState(null);
  const [matchId, setMatchId] = useState('');
  const [iceCandidates, setIceCandidates] = useState([]);
  const [candidatesFound, setCandidatesFound] = useState(false);
  const [stream, setStream] = useState(null);
  const [callButtonState, setCallButtonState] = useState(callState.setup)
  const { host, hostAvail, callInProgress } = state;
  
  useEffect(()=>{
    if(matchId && candidatesFound && iceCandidates){
      // Sent after local description is set
      // Basically when we know our match
      // and candidates can be and were generated
      wsSend('ice', { iceCandidates, matchId });
      // reset candidates found and ice candidates
      setCandidatesFound(false);
      setIceCandidates([]);
      setMatchId('');
    }
  }, [matchId, candidatesFound, iceCandidates]);

  // Effect on rtc peer creation
  useEffect(()=>{
    const offerResponse = (payload: wsPayload) => {
      rtcPeer.setRemoteDescription(payload.sdp);
      rtcPeer.createAnswer()
        .then(answer => {
          rtcPeer.setLocalDescription(answer)
            .then(()=>{
              dispatch({
                type: 'CALL_PROGRESS',
                payload: {
                  callInProgress: true,
                },
              });
              wsSend('answer', {sdp: answer, matchId: payload.matchId})
              setCallButtonState(callState.end);
            })
        })
        .catch(console.log)
      setMatchId(payload.matchId);
    };

    const receiveAnswer = (payload: wsPayload) => {
      rtcPeer.setRemoteDescription(payload.sdp);
      setMatchId(payload.matchId);
    }

    const iceHandler = (payload: wsPayload) => {
      payload.iceCandidates.forEach(candidate => {
        rtcPeer.addIceCandidate(candidate);
      });
    };

    // What to do with ice candidates
    const onIce = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        // sure we're supposed to send them candidate by candidate
        // but thats a lot of lambda invocations
        iceCandidates.push(event.candidate);
        setIceCandidates(iceCandidates);
      }
    };

    if(rtcPeer){
      wsOn('ice', iceHandler);
      wsOn('offer', offerResponse);
      wsOn('answer', receiveAnswer);
      rtcPeer.onicecandidate = onIce;
      rtcPeer.addEventListener('icegatheringstatechange', event => {
        if(rtcPeer.iceGatheringState === 'complete'){
          setCandidatesFound(true);
        }
      })
    } else if (typeof RTCPeerConnection !== 'undefined'){
      setRtcPeer(new RTCPeerConnection(configRTC));
    }
  }, [rtcPeer]);

  const setUpMedia = async (rtcObj) => {
    let ourStream = stream;
    if(!ourStream){
      try {
        ourStream = await getStream();
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
        const element = document.getElementById('mediaStream') as HTMLVideoElement | HTMLAudioElement;
        element.srcObject = event.streams[0];
      }
    }
    if(host){
      wsSend('SetAvail', {avail: true});
    }
    setCallButtonState(callState.call);
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
      setCallButtonState(callState.end);
    } catch (error){
      console.log(`call failed: ${error}`);
    }
  }

  const endCall = () => {
    rtcPeer.close();
    if(typeof document !== 'undefined'){
      const element = document.getElementById('mediaStream') as HTMLVideoElement | HTMLAudioElement;
      element.srcObject = null;
    }
    wsSend('EndCall');
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
    setCallButtonState(callState.call);
  }

  wsOn('EndCall', (payload: wsPayload)=>{
    endCall();
  });

  const callButtonSwitch = () => {
    if(callButtonState === callState.setup){
      setUpMedia(rtcPeer);
    } else if (callButtonState === callState.call){
      if(host){
        wsSend('SetAvail', {avail: !hostAvail});
      } else if (hostAvail && !callInProgress){
        connectCall();
      } else {
        console.log('connect button should probably be disabled');
      }
    } else if (callButtonState === callState.end){
      endCall();
    }
  }

  // show elements when host is available or call is in progress
  if ( hostAvail || callInProgress || host){
    return (
      <div>
        <button onClick={callButtonSwitch}>
          {host ? hostCallState[callButtonState]: callStateText[callButtonState]}
        </button>
        {!mediaConfig.video && (
          <audio id="mediaStream" autoPlay={true} playsInline>
            unsupported
          </audio>
        )}
        {mediaConfig.video && (
          <video id="mediaStream" autoPlay={true} playsInline>
            unsupported
          </video>
        )}
      </div>
    );
  } else {
    return null;
  }

}; // end of RTC function

export default RTC;