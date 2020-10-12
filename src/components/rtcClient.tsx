// rtc.tsx Copyright 2020 Paul Beaudet MIT Licence
// Experimental objective rtc component
import React, { useEffect, useContext, useState } from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
import { rtcConnection } from '../api/WebRTCClient';
import { GlobalUserContext } from '../context/GlobalState';
import { getStream } from '../api/media';
// import { createOffer, offerResponse } from '../api/WebRTC';
import { mediaConfig } from '../config/communication';
import { wsPayload } from '../interfaces/global';

const RTC = () => {
  const { state, dispatch } = useContext(GlobalUserContext);
  const { host, hostAvail, callInProgress } = state;
  const [stream, setStream] = useState(null);
  const [rtc, setRTC] = useState(new rtcConnection());

  const attachStream = async () => {
    if(stream){
      rtc.attachMedia(stream);
    } else {
      try {
        const initialStream = await getStream();
        setStream(initialStream);
        rtc.attachMedia(initialStream);
      } catch (error){
        throw new Error(`stream assignment error ${error}`);
      }
    }
  };

  const receiveOffer = (payload: wsPayload) => {
    attachStream()
      .then(()=>{
        rtc.offerResponse(payload)
          .then(answer => {
            wsSend('answer', answer);
            wsSend('SetAvail', { avail: false });
            dispatch({
              type: 'CALL_PROGRESS',
              payload: {
                callInProgress: true,
              },
            });
          })
          .catch(console.log);
      }).catch(console.log);
  }

  // effect on rtc object change
  useEffect( ()=> {
    // Assign ICE to rtc object when its received
    wsOn('ice', (payload) => {
      rtc.getRemoteIce(payload);
    });
    // Answer host if they call
    wsOn('answer', (payload) => {
      rtc.receiveAnswer(payload)
    });
    // Receive offers from guest
    wsOn('offer', (payload) => {
      receiveOffer(payload)
    });
    // What to do when a match and ICE candidates are known
    rtc.onMatchAndIce = () => {
      wsSend('ice', {
        iceCandidates: rtc.iceCandidates,
        matchId: rtc.matchId,
      });
    }
  }, [rtc]);

  useEffect(() => {
      if (hostAvail && !host && !callInProgress) {
        attachStream()
          .then(() => {
            rtc.createOffer()
              .then(offer => {
                wsSend('offer', offer);
                dispatch({
                  type: 'CALL_PROGRESS',
                  payload: {
                    callInProgress: true,
                  },
                });
              })
              .catch(console.log);
          })
          .catch(console.log);
      }
  }, [hostAvail]);

  return (
    <div>
      {!mediaConfig.video && (
        <audio id="mediaStream" autoPlay={true}>
          unsupported
        </audio>
      )}
      {mediaConfig.video && (
        <video id="mediaStream" autoPlay={true}>
          unsupported
        </video>
      )}
    </div>
  );
};

export default RTC;
