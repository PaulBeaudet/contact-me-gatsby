// rtc.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useEffect, useContext } from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
// import { rtcConnection } from '../api/WebRTC';
import { GlobalUserContext } from '../context/GlobalState';
// import { getStream } from '../api/media';
import { createOffer, offerResponse } from '../api/WebRTC';
import { mediaConfig } from '../config/communication';

const RTC = () => {
  const { state, dispatch } = useContext(GlobalUserContext);
  const { host, hostAvail, callInProgress } = state;

  // const streamSetup = async () => {
  //   try {
  //     // ask for a new or take existing stream
  //     const useStream = stream ? stream : await getStream();
  //     dispatch({
  //       type: 'SET_STREAM',
  //       payload: { stream: useStream },
  //     });
  //     return useStream;
  //   } catch (error) {
  //     return error;
  //   }
  // };
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
      // streamSetup()
      //   .then(stream => {
      //     const rtc = new rtcConnection(stream);
      //     console.log('stream setup responding to offer');
      //     rtc.offerResponse(payload);
      //   })
      //   .catch(console.log);
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
      // streamSetup()
      //   .then(stream => {
      //     const rtc = new rtcConnection(stream);
      //     console.log(rtc);
      //     rtc.createOffer();
      //   })
      //   .catch(console.log);
    } // TODO else if connection was open cleanly close it
    // because they just went offline
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
