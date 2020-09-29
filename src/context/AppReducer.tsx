import { reducerActionType, GlobalContextType } from '../interfaces/global';
import { userState } from './GlobalState';

export default (state: GlobalContextType, action: reducerActionType) => {
  if (action.type === 'SIGN_IN') {
    // add user data when logged in
    return {
      ...state,
      ...action.payload,
    };
  } else if (action.type === 'LOG_OUT') {
    return {
      ...userState,
    };
  } else if (action.type === 'CHANGE_TARGET') {
    return {
      ...state,
      ...action.payload,
    };
  } else if (action.type === 'HOST_ATTEMPT') {
    return {
      ...state,
      host: true,
    };
  } else if (action.type === 'HOST_FAIL') {
    return {
      ...state,
      host: false,
    };
  } else {
    return state;
  }
};
