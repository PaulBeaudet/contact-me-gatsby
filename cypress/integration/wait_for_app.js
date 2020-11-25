// wait_for_app.js
// some utilities so that buttons get clicked on after they exist

let appHasStarted
const spyOnAddEventListener = (win) => {
  // win = window object in our application
  const addListener = win.EventTarget.prototype.addEventListener
  win.EventTarget.prototype.addEventListener = function (name) {
    if (name === 'change') {
      // web app added an event listener to the input box -
      // that means the web application has started
      appHasStarted = true;
      // restore the original event listener
      win.EventTarget.prototype.addEventListener = addListener;
    }
    return addListener.apply(this, arguments);
  };
};

const waitForAppStart = () => {
  // keeps rechecking "appHasStarted" variable
  return new Cypress.Promise((resolve) => {
    const isReady = () => {
      if (appHasStarted) {
        return resolve();
      }
      setTimeout(isReady, 0);
    }
    isReady();
  });
};

module.exports = {
  spyOnAddEventListener,
  waitForAppStart,
}