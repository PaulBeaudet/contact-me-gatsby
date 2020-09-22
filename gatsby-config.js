module.exports = {
  siteMetadata: {
    title: process.env.SITE_TITLE,
    description: process.env.DESCRIPTION,
    author: process.env.SITE_AUTHOR,
    contact_api: process.env.CONTACT_API_URL,
    contact_redirect: process.env.AFTER_CONTACT_REDIRECT,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/profile142.JPG`, // This path is relative to the root of the site.
      },
    },
  ],
};
