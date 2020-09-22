export const loadStorage = () => {
  // keep in mind that Gatsby build has no idea about the DOM
  // or being a real browser for that matter
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
    return localStorage;
  } else {
    return null;
  }
};

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
