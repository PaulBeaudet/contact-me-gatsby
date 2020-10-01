import React, { useState, useEffect, useContext } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';
import { wsOn, wsSend } from '../api/WebSocket';
// import { rtcConnection } from '../api/WebRTC';
import { GlobalUserContext } from '../context/GlobalState';
// import { getStream } from '../api/media';
import { createOffer, offerResponse } from '../api/WebRTC';

const WaysToContact = () => {
  // State of host availability
  const [available, setAvailable] = useState(false);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { host, stream } = state;

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
    wsSend('GetAvail');
    wsOn('AVAIL', payload => {
      const { avail } = payload;
      setAvailable(avail);
    });
    wsOn('offer', payload => {
      console.log('getting an offer');
      offerResponse(payload);
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
    // Make sure not the host before talking to the host
    if (!host && available) {
      //&& hostId) {
      console.log('creating offer');
      createOffer();
      // streamSetup()
      //   .then(stream => {
      //     const rtc = new rtcConnection(stream);
      //     console.log(rtc);
      //     rtc.createOffer();
      //   })
      //   .catch(console.log);
    }
  }, [available]);

  return (
    <div className="basic-grey">
      <h1>
        {` Contact - ${process.env.GATSBY_SITE_AUTHOR}`}
        <span>
          {available
            ? 'Online: Leave a message or call'
            : 'Busy: Please leave a message'}
        </span>
      </h1>
      <Dm />
      <br />
      <Authenticate />
      <video id="mediaStream" autoPlay={true}>
        unsupported
      </video>
    </div>
  );
};

export default WaysToContact;
