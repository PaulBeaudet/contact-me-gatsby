export interface siteMetadata {
  siteMetadata: {
    title: string;
    author: string;
    description: string;
  };
}

export type MetaQuery = {
  site: siteMetadata;
};

export interface GlobalContextType {
  clientOid: string;
  lastSession: string;
  sessionOid: string;
  loggedIn: boolean;
  email: string;
  host: boolean;
  hostAvail: boolean;
  callInProgress: boolean;
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
