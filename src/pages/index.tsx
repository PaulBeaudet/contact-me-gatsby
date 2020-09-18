import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import WaysToContact from '../components/WaysToContact';
import { GlobalUserProvider } from '../context/GlobalState';

const IndexPage = () => {
  return (
    <Layout>
      <SEO />
      <GlobalUserProvider>
        <WaysToContact />
      </GlobalUserProvider>
    </Layout>
  );
};

export default IndexPage;
