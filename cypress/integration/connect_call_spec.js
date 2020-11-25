// connect_call_spec.js Copyright 2020 Paul Beaudet MIT License
// Can a visitor connect with a host
// NOTE this is not a fully automated test and is meant be triggered on two separate devices
/// <reference types="cypress" />

const {
  spyOnAddEventListener,
  waitForAppStart,
} = require('./wait_for_app');

const {
  email,
  password,
  guest,
} = Cypress.env();


describe('Contact Page', () => {
  if(guest){
    it('Visitor can connect with available host', () => {
      cy.visit('/', {
        onBeforeLoad: spyOnAddEventListener
      }).then(waitForAppStart);
      cy.get('span').should('contain', 'ONLINE');
      cy.contains('Setup call').click();
      cy.contains('mute').click();
      cy.contains('Connect call').click();
      cy.get('button').should('contain', 'End call');
    });
  } else {
    it('Host can sign in a become available', () => {
      cy.visit('/', {
        onBeforeLoad: spyOnAddEventListener
      }).then(waitForAppStart);
      cy.contains('Sign-in view').click();
      cy.get('input[placeholder="email"]').type(email);
      cy.get('input[placeholder="password"]').type(password);
      cy.contains('Sign-in').click();
      cy.contains('Setup call').click();
      cy.contains('Set as Available').click();
    });
  }
});