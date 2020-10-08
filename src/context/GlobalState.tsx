import React, { createContext, useReducer } from 'react';
import { initLS } from '../api/LocalStorage';
import { GlobalContextType } from '../interfaces/global';
import AppReducer from './AppReducer';

// default user state to initiate with
const userState: GlobalContextType = {
  clientOid: '',
  sessionOid: '',
  lastSession: '',
  loggedIn: false,
  email: '',
  host: false,
  stream: null,
  hostAvail: false,
  callInProgress: false,
};

const persistentState = initLS(userState);

interface props {
  children?: any;
}
// Create the context
const GlobalUserContext = createContext<GlobalContextType | any>(
  persistentState
);

// Global state component that child components can derive context from
const GlobalUserProvider: React.FC<props> = ({ children }) => {
  const [state, dispatch] = useReducer<any>(AppReducer, persistentState);

  return (
    <GlobalUserContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalUserContext.Provider>
  );
};

export { GlobalUserContext, GlobalUserProvider, userState };
