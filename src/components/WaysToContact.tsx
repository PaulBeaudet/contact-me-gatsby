// WaysToContact.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useContext, useEffect, useState } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';
import { GlobalUserContext } from '../context/GlobalState';
import RTC from './rtc';
import { wsSend, wsOn } from '../api/WebSocket';
import { wsPayload } from '../interfaces/global';
import Footer from './footer';

const WaysToContact = () => {
  const [showDm, setShowDm] = useState(true);
  const { state, dispatch } = useContext(GlobalUserContext);
  const { hostAvail, loggedIn, callInProgress} = state;

  useEffect(() => {
    wsOn('AVAIL', (payload: wsPayload) => {
      const { avail } = payload;
      dispatch({
        type: 'HOST_AVAIL',
        payload: {
          hostAvail: avail,
        },
      });
    });
    if(!loggedIn) {
      wsSend('GetAvail');
    }
  }, []);

  const showAuth: boolean = !showDm || loggedIn;
  const dmShowing: boolean = !loggedIn && showDm && !callInProgress;
  return (
    <div className="basic-grey">
      <h1>
        {` Contact - ${process.env.GATSBY_SITE_AUTHOR}`}
        <span>
          {hostAvail
            ? 'ONLINE: Call or leave a message'
            : 'BUSY: Please leave a message'}
        </span>
      </h1>
      <RTC />
      {!loggedIn && hostAvail && <p> - or message - </p>}
      {dmShowing && <Dm />}
      {showAuth && <Authenticate />}
      {!loggedIn && !hostAvail && !callInProgress && <>
      <br />
      <button
        onClick={() => {
          setShowDm(!showDm);
        }}
      >
        {showDm ? 'Sign-in view': 'Message view'}
      </button>
      </>}
      <Footer />
    </div>
  );
};

export default WaysToContact;
