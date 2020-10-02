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

export interface GlobalContextType {
  loggedIn: boolean;
  email: string;
  host: boolean;
  stream: any;
  hostAvail: boolean;
}

export interface reducerActionType {
  type: string;
  payload: any;
}

export interface wsPayload {
  action: string;
  // Let any other payload items exist other than action
  [x: string]: any;
}
