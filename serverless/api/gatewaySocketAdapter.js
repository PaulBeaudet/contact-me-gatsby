// socket.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const AWS = require('aws-sdk');
// make apigateway namespace available
require('aws-sdk/clients/apigatewaymanagementapi');

// Post api gateway responses
// resolves sent status true | false
let send = async (ConnectionId, action, jsonData, event, db) => {
  const fullEndpoint = `${event.requestContext.domainName}${process.env.ENDPOINT_ROUTE}`
  const gateway = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: fullEndpoint,
  });
  jsonData.action = action;
  const Data = JSON.stringify(jsonData);
  const request = gateway.postToConnection({ConnectionId, Data});
  try {
    await request.promise();
    console.log(`sending a message to ${ConnectionId}`);
    return true;
  } catch (error){
    if (error.statusCode === 410){
      console.log(`deleting ${ConnectionId}: no longer responsive`);
      try {
        await db.collection('socketPool').deleteOne({connectionId: ConnectionId});
      } catch (err){
        console.log(`issue deleting dead connection ${ConnectionId}: ${err}`);
        return false;
      }
    } else {
      console.log(`error sending api message to ${ConnectionId}: ${error}`);
      return false;
    }
  }
};

// ways to broadcast with a lambda functions
let broadcast = async (ConnectionId, action, jsonData, event, db) => {
  try {
    // For every participant in the socket pool 
    const cursor = db.collection('socketPool').find({});
    await cursor.forEach(async client => {
      if (client.connectionId === ConnectionId){return;} 
      try {
        await send(client.connectionId, action, jsonData, event, db);
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
        await send(client.connectionId, action, jsonData, event, db);
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
    event.sendTo(ConnectionId, action, jsonData);
  };
  broadcast = (ConnectionId, action, jsonData, event) => {
    event.broadcast(ConnectionId, action, jsonData);
  };
  broadcastAll = (ConnectionId, action, jsonData, event) => {
    event.broadcastAll(ConnectionId, action, jsonData);
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
  broadcast,
  broadcastAll,
};
