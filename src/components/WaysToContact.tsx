import React, { useState, useEffect } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';
import { wsOn, wsSend } from '../api/WebSocket';

const WaysToContact = () => {
  // State of host availability
  const [available, setAvailable] = useState(false);

  // ask and listen for host availability
  useEffect(() => {
    wsSend('GetAvail');
    wsOn('AVAIL', req => {
      setAvailable(req.avail);
    });
  }, []);

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
