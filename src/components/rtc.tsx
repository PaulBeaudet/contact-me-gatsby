// rtcClient.tsx Copyright 2020 Paul Beaudet MIT Licence
// Working rtc component
import React, { useEffect, useContext } from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
import { GlobalUserContext } from '../context/GlobalState';
import { createOffer, offerResponse } from '../api/WebRTC';
import { mediaConfig } from '../config/communication';

const RTC = () => {
  const { state, dispatch } = useContext(GlobalUserContext);
  const { host, hostAvail, callInProgress } = state;

  // ask and listen for host availability
  useEffect(() => {
    wsOn('offer', payload => {
      offerResponse(payload)
        .then(() => {
          wsSend('SetAvail', { avail: false });
          dispatch({
            type: 'CALL_PROGRESS',
            payload: {
              callInProgress: true,
            },
          });
        })
        .catch(error => {
          console.log(`call failed: ${error}`);
        });
    });
  }, []);

  useEffect(() => {
    if (!host && hostAvail && !callInProgress) {
      createOffer()
        .then(() => {
          dispatch({
            type: 'CALL_PROGRESS',
            payload: {
              callInProgress: true,
            },
          });
        })
        .catch(error => {
          console.log(`call failed: ${error}`);
        });
    }
  }, [host, hostAvail]);

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