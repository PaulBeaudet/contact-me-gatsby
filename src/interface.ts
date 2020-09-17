export interface siteMetadata {
  siteMetadata: {
    title: string;
    author: string;
    description: string;
    contact_api: string;
    contact_redirect: Location;
  };
}

export type MetaQuery = {
  site: siteMetadata;
};
