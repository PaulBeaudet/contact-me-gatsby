// footer.tsx Copyright 2020 Paul Beaudet MIT Licence
import React from 'react';

const Footer: React.FC = () => {
  return (
    <>
      <hr />
      <footer>
        "Contact" built by Paul Beaudet for deabute.com -
        <span> </span>
        <a href={process.env.GATSBY_REPO_URL}>Source Code</a>
      </footer>
    </>
  )
}

export default Footer;