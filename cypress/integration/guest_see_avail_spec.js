// guest_see_avail_spec.js Copyright 2020 Paul Beaudet MIT License
// Is the host for this page able to change availability?
/// <reference types="cypress" />

const {createOid} = require('../../isomorphic/oid');
const thisSession = createOid();
const lastSession = thisSession;
const clientOid = thisSession;
const {
  WS_URL,
  email,
  password,
} = Cypress.env();

describe('Contact Page', () => {
  it('Authorized host can change availability for visitors', () => {
    cy.visit('/');
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      ws.send(JSON.stringify({action: 'login', email, password,  thisSession, lastSession, clientOid}));
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if(data.action === 'login'){
          ws.send(JSON.stringify({action: 'SetAvail', avail: true}));
        }
      }
    }
    cy.get('span').should('contain', 'ONLINE');
    cy.get('button').should('contain', 'Setup call');
  });
});