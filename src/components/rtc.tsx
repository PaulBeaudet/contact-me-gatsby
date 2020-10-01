// rtc.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useEffect, useContext } from 'react';
import { wsOn, wsSend } from '../api/WebSocket';
import { rtcConnection } from '../api/WebRTC';
import { GlobalUserContext } from '../context/GlobalState';
import { getStream } from '../api/media';

const RTC = () => {
  // State of host availability
  const { state, dispatch } = useContext(GlobalUserContext);
  const { host, stream, available } = state;

  const streamSetup = async () => {
    try {
      // ask for a new or take existing stream
      const useStream = stream ? stream : await getStream();
      const rtc = new rtcConnection(useStream);
      dispatch({
        type: 'SET_STREAM',
        payload: { stream: useStream },
      });
      return rtc;
    } catch (error) {
      return error;
    }
  };
  // ask and listen for host availability
  useEffect(() => {
    wsSend('GetAvail');
    wsOn('AVAIL', payload => {
      const { avail } = payload;
      dispatch({
        type: 'SET_AVAILABLE',
        payload: { available: avail },
      });
    });
    wsOn('offer', payload => {
      console.log('getting an offer');
      streamSetup()
        .then(rtc => {
          console.log('stream setup making offer');
          rtc.offerResponse(payload);
        })
        .catch(console.log);
    });
  }, []);

  useEffect(() => {
    // Make sure not the host before talking to the host
    if (!host && available) {
      streamSetup()
        .then(rtc => {
          rtc.createOffer();
        })
        .catch(console.log);
    }
  }, [available]);

  return (
    <div className="basic-grey">
      <video id="mediaStream" autoPlay={true}>
        unsupported
      </video>
    </div>
  );
};

export default RTC;
