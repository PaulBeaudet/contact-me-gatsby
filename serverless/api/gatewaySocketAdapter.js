// socket.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const AWS = require('aws-sdk');
const { find } = require('../db/mongo');
// make apigateway namespace available
require('aws-sdk/clients/apigatewaymanagementapi');

// default to creating api gateway responses
let send = (ConnectionId, action, jsonData, event) => {
  const gateway = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: `${event.requestContext.domainName}${process.env.ENDPOINT_ROUTE}`,
  });
  jsonData.action = action;
  const Data = JSON.stringify(jsonData);
  gateway.postToConnection(
    {
      ConnectionId,
      Data,
    },
    error => {
      if (error) {
        console.log(`issue sending to ${ConnectionId}`);
      }
    }
  );
};

// As far as API Gateway is concerned respond and send are the same thing
// as there is no state, whereas we maintain state in a monolith setup
let respond = send;

// ways to broadcast with a lambda functions
let broadcast = async (ConnectionId, action, jsonData, event) => {
  const onClient = client => {
    if (client.connectionId === ConnectionId) {
      return;
    }
    send(client.connectionId, action, jsonData, event);
  };
  try {
    await find(onClient);
  } catch (error) {
    console.log(error);
  }
};

let broadcastAll = async (ConnectionId, action, jsonData, event) => {
  const onClient = client => {
    send(client.connectionId, action, jsonData, event);
  };
  try {
    await find(onClient);
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
  broadcast = (ConnectionId, action, jsonData, event) => {
    event.broadcast(ConnectionId, action, jsonData, event);
  };
  broadcastAll = (ConnectionId, action, jsonData, event) => {
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

const parseBody = event => {
  if (!event.body) {
    return null;
  }
  let data = {};
  try {
    data = JSON.parse(event.body);
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
