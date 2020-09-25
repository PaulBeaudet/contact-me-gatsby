// socket.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const AWS = require('aws-sdk');
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

// Change events to represent how they work in the monolith env
if (process.env.MONOLITH === 'true') {
  send = (ConnectionId, action, jsonData, event) => {
    event.sendTo(ConnectionId, action, jsonData);
  };
  respond = (ConnectionId, action, jsonData, event) => {
    event.respond(ConnectionId, action, jsonData);
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

module.exports._400 = lambdaReturn(400);
module.exports._200 = lambdaReturn(200);
module.exports.send = send;
module.exports.respond = respond;
