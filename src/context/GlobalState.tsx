import React, { createContext, useReducer } from 'react';
import { GlobalContextType } from '../interface';
import AppReducer from './AppReducer';

export const userState: GlobalContextType = {
  loggedIn: false,
  displayName: '',
  email: '',
  photoURL: '',
  uid: '',
};

interface props {
  children?: any;
}
// Create the context
export const GlobalUserContext = createContext<GlobalContextType | any>(
  userState
);

// Global state component that child components can derive context from
export const GlobalUserProvider: React.FC<props> = ({ children }) => {
  const [state, dispatch] = useReducer<any>(AppReducer, userState);

  return (
    <GlobalUserContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalUserContext.Provider>
  );
};