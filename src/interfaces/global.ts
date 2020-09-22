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
  // displayName: string;
  email: string;
  // photoURL: string;
  // uid: string;
}

export interface reducerActionType {
  type: string;
  payload: any;
}
