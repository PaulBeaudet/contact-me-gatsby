import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Dm from '../components/dm';

const IndexPage = () => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          author
        }
      }
    }
  `);
  const { author } = site.siteMetadata;
  return (
    <Layout>
      <SEO title={author} />
      <Dm />
    </Layout>
  );
};

export default IndexPage;
