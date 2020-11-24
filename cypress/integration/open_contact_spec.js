// open_contact_spec.jst Copyright 2020 Paul Beaudet MIT License
// First Cypress test
/// <reference types="cypress" />

describe('Contact Page', () => {
  it('successfully loads', () => {
    cy.visit('/');
  });
});