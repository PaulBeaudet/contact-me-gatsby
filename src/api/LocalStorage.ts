// LocalStorage.ts Copyright 2020 Paul Beaudet MIT License
// keep in mind that Gatsby build has no idea about the DOM
// or being a real browser for that matter
// hence all the "is window undefined?" checking
const write = (data: any) => {
  if (typeof window !== 'undefined') {
    Object.keys(data).forEach(key => {
      localStorage[key] = data[key];
    });
  }
};

const read = (key: string) => {
  if (typeof window !== 'undefined') {
    return localStorage[key];
  }
};

// Place holder in case localStorage fails to instantiate
export const noStorage = {
  read: console.log,
  write: console.log,
  real: false,
};

export const loadStorage = () => {
  if (typeof window !== 'undefined' && localStorage) {
    if (!localStorage.oid) {
      localStorage.oid = createOid();
    }
    if (!localStorage.token) {
      localStorage.token = '';
    }
    if (!localStorage.email) {
      localStorage.email = '';
    }
    return {
      write,
      read,
      real: true,
    };
  } else {
    return noStorage;
  }
};

// This is rip off of how the mongo driver creates an oid
export const createOid = () => {
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
