// WaysToContact.tsx Copyright 2020 Paul Beaudet MIT Licence
import React, { useContext } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';
import { GlobalUserContext } from '../context/GlobalState';
import RTC from './rtc';

const WaysToContact = () => {
  const { state } = useContext(GlobalUserContext);
  const { hostAvail } = state;

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
