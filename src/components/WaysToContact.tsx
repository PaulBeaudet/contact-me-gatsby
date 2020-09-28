import React, { useState, useEffect, useContext } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';
import { wsOn, wsSend } from '../api/WebSocket';
import { createOffer } from '../api/WebRTC';
import { GlobalUserContext } from '../context/GlobalState';

const WaysToContact = () => {
  // State of host availability
  const [available, setAvailable] = useState(false);
  const [hostId, setHostId] = useState('');
  const { state } = useContext(GlobalUserContext);
  const { host } = state;

  // ask and listen for host availability
  useEffect(() => {
    wsSend('GetAvail');
    wsOn('AVAIL', payload => {
      const { hostId, avail } = payload;
      setAvailable(avail);
      setHostId(hostId);
    });
  }, []);

  useEffect(() => {
    // Make sure not the host before making an offer
    // to talk to the host
    if (!host) {
      // Creates and relays a WebRTC offer to connect
      // with host of link
      createOffer(hostId);
    }
  }, [available, hostId]);

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
    </div>
  );
};

export default WaysToContact;
