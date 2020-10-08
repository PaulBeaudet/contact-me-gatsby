// LocalStorage.ts Copyright 2020 Paul Beaudet MIT License
// keep in mind that Gatsby build has no idea about the DOM
// or being a real browser for that matter

// hence all the "is window undefined?" checking
const writeLS = (data: any) => {
  if (typeof window !== 'undefined') {
    Object.keys(data).forEach(key => {
      localStorage[key] = data[key];
    });
  }
};

const initLS = state => {
  if (typeof window !== 'undefined') {
    if (!localStorage.clientOid) {
      // Create persistent client identifier
      localStorage.clientOid = createOid();
    }
    localStorage.sessionOid = createOid();
    window.addEventListener('beforeunload', () => {
      localStorage.stream = 'null';
      localStorage.host = 'false';
      localStorage.hostAvail = 'false';
      localStorage.callInProgress = 'false';
      localStorage.lastSession = localStorage.sessionOid;
      localStorage.sessionOid = '';
    });
    // remember localStorage can only store string primitive types
    const storageWithBooleans = {};
    Object.keys(localStorage).forEach(key => {
      if (localStorage[key] === 'false') {
        storageWithBooleans[key] = false;
      } else if (localStorage[key] === 'true') {
        storageWithBooleans[key] = true;
      } else if (localStorage[key] === 'null') {
        storageWithBooleans[key] = null;
      } else {
        storageWithBooleans[key] = localStorage[key];
      }
    });
    state = {
      ...state,
      ...storageWithBooleans,
    };
  }
  return state;
};

// This is rip off of how the mongo driver creates an oid
const createOid = () => {
  const increment = Math.floor(Math.random() * 16777216).toString(16);
  const pid = Math.floor(Math.random() * 65536).toString(16);
  const machine = Math.floor(Math.random() * 16777216).toString(16);
  const timestamp = Math.floor(new Date().valueOf() / 1000).toString(16);
  return (
    '00000000'.substr(0, 8 - timestamp.length) +
    timestamp +
    '000000'.substr(0, 6 - machine.length) +
    machine +
    '0000'.substr(0, 4 - pid.length) +
    pid +
    '000000'.substr(0, 6 - increment.length) +
    increment
  );
};

export { initLS, writeLS };
