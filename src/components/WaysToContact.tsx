import React, { useState } from 'react';
import Dm from './dm';
import { useStaticQuery, graphql } from 'gatsby';
import { MetaQuery } from '../interface';
import Authorize from './authorize';

const WaysToContact = () => {
  const [available, setAvailable] = useState(false);
  const { site }: MetaQuery = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          contact_api
          author
        }
      }
    }
  `);
  const { contact_api, author } = site.siteMetadata;

  return (
    <div className="basic-grey">
      <h1>
        {` Contact - ${author}`}
        <span>
          {available
            ? 'Online: Leave a message or call'
            : 'Busy: Please leave a message'}
        </span>
      </h1>
      <Dm contactApi={contact_api} />
      <Authorize />
    </div>
  );
};

export default WaysToContact;
