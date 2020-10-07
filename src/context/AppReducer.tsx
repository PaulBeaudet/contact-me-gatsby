// AppReducer.tsx Copyright 2020 Paul Beaudet MIT License
import { writeLS } from '../api/LocalStorage';
import { reducerActionType, GlobalContextType } from '../interfaces/global';

export default (state: GlobalContextType, action: reducerActionType) => {
  // action doesn't need to be included in state
  delete action.payload.action;
  // Given state change is to be reduced as presented return as is
  const newState = {
    // take the previous state
    ...state,
    // overwrite any properties provide by payload
    ...action.payload,
  };
  writeLS(newState);
  return newState;
};
