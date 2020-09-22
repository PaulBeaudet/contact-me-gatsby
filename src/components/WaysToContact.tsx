import React, { useState } from 'react';
import Dm from './dm';
import Authenticate from './authenticate';

const WaysToContact = () => {
  const [available, setAvailable] = useState(false);

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
