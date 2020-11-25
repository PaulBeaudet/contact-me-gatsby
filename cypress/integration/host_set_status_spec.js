// host_set_status_spec.js Copyright 2020 Paul Beaudet MIT License
// Is the host for this page able to change availability?
/// <reference types="cypress" />

const {
  spyOnAddEventListener,
  waitForAppStart,
} = require('./wait_for_app');

const {
  email,
  password,
} = Cypress.env();

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