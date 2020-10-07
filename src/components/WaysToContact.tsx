// WaysToContact.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useContext, useEffect } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';
import { GlobalUserContext } from '../context/GlobalState';
import RTC from './rtc';
import { wsSend, wsOn } from '../api/WebSocket';

const WaysToContact = () => {
  const { state, dispatch } = useContext(GlobalUserContext);
  const {
    hostAvail,
    loggedIn,
    clientOid,
    sessionOid,
    lastSession,
    email,
  } = state;

  useEffect(() => {
    wsOn('AVAIL', payload => {
      const { avail } = payload;
      dispatch({
        type: 'HOST_AVAIL',
        payload: {
          hostAvail: avail,
        },
      });
    });
    if (loggedIn) {
      wsSend('login', {
        clientOid,
        lastSession,
        thisSession: sessionOid,
        email,
      });
      dispatch({
        type: 'HOST_ATTEMPT',
        payload: {
          host: true,
        },
      });
    } else {
      wsSend('GetAvail');
    }
  }, []);

  return (
    <div className="basic-grey">
      <h1>
        {` Contact - ${process.env.GATSBY_SITE_AUTHOR}`}
        <span>
          {hostAvail
            ? 'ONLINE: Leave a message or allow microphone to talk'
            : 'BUSY: Please leave a message'}
        </span>
      </h1>
      <Dm />
      <br />
      <Authenticate />
      <RTC />
    </div>
  );
};

export default WaysToContact;
