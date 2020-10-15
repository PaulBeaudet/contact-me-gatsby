// socket.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const AWS = require('aws-sdk');
// make apigateway namespace available
require('aws-sdk/clients/apigatewaymanagementapi');

// default to creating api gateway responses
let send = (ConnectionId, action, jsonData, event) => {
  return new Promise((resolve, reject) => {
    const fullEndpoint = `${event.requestContext.domainName}${process.env.ENDPOINT_ROUTE}`
    const gateway = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: fullEndpoint,
    });
    jsonData.action = action;
    const Data = JSON.stringify(jsonData);
    gateway.postToConnection({ConnectionId, Data}, error =>{
      if (error){
        if (error.statusCode === 410){
          console.log('1: skipping client thats no longer here');
          resolve(true);
        } else {
          console.log(`error sending api message ${error}`);
          reject(error);
        }
      } else {
        resolve(true);
      }
    });
  });
};

// As far as API Gateway is concerned respond and send are the same thing
// as there is no state, whereas we maintain state in a monolith setup
let respond = send;

// ways to broadcast with a lambda functions
let broadcast = async (ConnectionId, action, jsonData, event, db) => {
  try {
    // For every participant in the socket pool 
    const cursor = db.collection('socketPool').find({});
    await cursor.forEach(async client => {
      if (client.connectionId === ConnectionId){return;} 
      try {
        await send(client.connectionId, action, jsonData, event);
      } catch (error){
        console.log(error);
      }
    })
  } catch (error) {
    console.log(error);
  }
};

let broadcastAll = async (ConnectionId, action, jsonData, event, db) => {
  try {
    // For every participant in the socket pool 
    const cursor = db.collection('socketPool').find({});
    await cursor.forEach(async client => {
      try {
        await send(client.connectionId, action, jsonData, event);
      } catch (error){
        console.log(error);
      }
    })
  } catch (error) {
    console.log(error);
  }
};

// Change events to represent how they work in the monolith env
if (process.env.MONOLITH === 'true') {
  send = (ConnectionId, action, jsonData, event) => {
    event.sendTo(ConnectionId, action, jsonData, event);
  };
  respond = (ConnectionId, action, jsonData, event) => {
    event.respond(ConnectionId, action, jsonData, event);
  };
  broadcast = (ConnectionId, action, jsonData, event, db) => {
    event.broadcast(ConnectionId, action, jsonData, event);
  };
  broadcastAll = (ConnectionId, action, jsonData, event, db) => {
    event.broadcastAll(ConnectionId, action, jsonData, event);
  };
}

const lambdaReturn = statusCode => {
  return (data = {}) => {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: statusCode,
      body: JSON.stringify(data),
    };
  };
};

const parseBody = body => {
  if (!body) {
    console.log(`parseBody: No body on first check!`);
    return null;
  }
  let data = {};
  try {
    data = JSON.parse(body);
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = {
  _200: lambdaReturn(200),
  _400: lambdaReturn(400),
  parseBody,
  send,
  respond,
  broadcast,
  broadcastAll,
};
