import { reducerActionType, GlobalContextType } from '../interfaces/global';

export default (state: GlobalContextType, action: reducerActionType) => {
  // Given state change is to be reduced as presented return as is
  const asIs = {
    // take the previous state
    ...state,
    // overwrite any properties provide by payload
    ...action.payload,
  };
  // console.log('reducing to ');
  // console.dir(asIs);
  if (action.type === 'SIGN_IN') {
    return asIs;
  } else if (action.type === 'LOG_OUT') {
    return asIs;
  } else if (action.type === 'CHANGE_TARGET') {
    return asIs;
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
  } else if (action.type === 'SET_STREAM') {
    return asIs;
  } else {
    return asIs;
  }
};
