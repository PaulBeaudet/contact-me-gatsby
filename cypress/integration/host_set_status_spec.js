// host_set_status_spec.js Copyright 2020 Paul Beaudet MIT License
// Is the host for this page able to change availability?
/// <reference types="cypress" />

const {
  email,
  password,
} = Cypress.env();

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

describe('Contact Page', () => {
  it('Can sign in and make self available or busy', () => {
    cy.visit('/', {
      onBeforeLoad: spyOnAddEventListener
    }).then(waitForAppStart);
    cy.contains('Sign-in view').click();
    cy.get('input[placeholder="email"]').type(email);
    cy.get('input[placeholder="password"]').type(password);
    cy.contains('Sign-in').click();
    cy.contains('Setup call').click();
    cy.contains('Set as Available').click();
    cy.get('span').should('contain', 'ONLINE');
    cy.contains('Set Away').click();
    cy.get('span').should('contain', 'BUSY');
  });
});