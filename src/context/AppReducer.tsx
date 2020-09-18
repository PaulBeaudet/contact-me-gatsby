import { reducerActionType, GlobalContextType } from '../interface';
import { userState } from './GlobalState';

export default (state: GlobalContextType, action: reducerActionType) => {
  if (action.type === 'SIGN_IN') {
    // add user data when logged in
    return {
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
  } else {
    return state;
  }
};
