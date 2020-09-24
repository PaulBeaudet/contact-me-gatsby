// monolithic_server.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const express = require('express');
const app = express();
const path = require('path');
const WebSocket = require('ws');
const yaml = require('js-yaml'); // read serverless.yml file
const fs = require('fs'); // built in file system library
const Responses = require('./apiGateway/API_Response');
const { mongo } = require('./dbAbstractions/mongo');

// similar logic to new mongo.ObjectID() except this just returns a string
const createOid = () => {
  const increment = Math.floor(Math.random() * 16777216).toString(16);
  const pid = Math.floor(Math.random() * 65536).toString(16);
  const machine = Math.floor(Math.random() * 16777216).toString(16);
  const timestamp = Math.floor(new Date().valueOf() / 1000).toString(16);
  return (
    '00000000'.substr(0, 8 - timestamp.length) +
    timestamp +
    '000000'.substr(0, 6 - machine.length) +
    machine +
    '0000'.substr(0, 4 - pid.length) +
    pid +
    '000000'.substr(0, 6 - increment.length) +
    increment
  );
};

// use an in memory array when no db is available
let wsConnections = [];

// placeholder methods can be over written by serverless forFunctions
const gatewayWs = {
  connect: async event => {
    console.log(event);
    const { connectionId, sendFunc } = event.requestContext;
    wsConnections.push({
      connectionId,
      sendFunc,
    });
    return Responses._200({ message: 'connected' });
  },
  disconnect: async event => {
    // console.dir(event);
    // reconstruct connection array without this client's connection
    const { connectionId } = event.requestContext;
    wsConnections = wsConnections.filter(
      connection => connection.connectionId !== connectionId
    );
    return Responses._200({ message: 'disconnected' });
  },
  default: async event => {
    // route has yet to be created
    console.dir(event);
    return Responses._400({ message: 'nope' });
  },
};

const socket = {
  init: server => {
    new WebSocket.Server({
      server,
      autoAcceptConnections: false,
    }).on('connection', ws => {
      // connection information to hold in memory or persistently
      const connectionId = createOid();
      const sendFunc = socket.send(ws); // <- this may be tough to store server side
      // Emulate connect event in api gateway
      gatewayWs.connect({
        requestContext: {
          connectionId,
          sendFunc,
        },
      });
      // handle incoming request
      ws.on('message', message => {
        socket.incoming(message, sendFunc, connectionId);
      });
    });
  },
  send: ws => {
    return msgObj => {
      let msg = '';
      try {
        msg = JSON.stringify(msgObj);
      } catch (error) {
        console.log(error);
      }
      console.log('response from server ' + msg);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
        return true;
      } else {
        return false;
      }
    };
  },
  sendTo: (oid, msgObj) => {
    let msg = '';
    try {
      msg = JSON.stringify(msgObj);
    } catch (error) {
      console.log(error);
    }
    console.log('response from server ' + msg);
    for (let i = 0; i < wsConnections.length; i++) {
      if (wsConnections[i].connectionId === oid) {
        const sent = wsConnections[i].sendFunc(msgObj);
        return sent ? true : false;
      }
    }
    return false;
  },
  on: (action, func) => {
    socket.handlers.push({ action, func });
  },
  handlers: [
    {
      action: 'msg',
      func: req => {
        console.log(req.msg);
      },
    },
  ],
  // handle incoming socket messages
  incoming: (event, sendFunc, connectionId) => {
    let req = { action: null };
    // if error we don't care there is a default object
    try {
      req = JSON.parse(event);
    } catch (error) {
      console.log(error);
    }
    const apiGWCallback = (firstArg, secondArg) => {
      console.log(JSON.stringify(secondArg));
    };
    for (let h = 0; h < socket.handlers.length; h++) {
      if (req.action === socket.handlers[h].action) {
        const apiGWEvent = {
          body: event,
          deabute: {
            sendTo: socket.sendTo,
            response: sendFunc,
          },
          requestContext: {
            connectionId,
          },
        };
        socket.handlers[h].func(apiGWEvent, {}, apiGWCallback);
        return;
      }
    }
    if (req.message === 'Internal server error') {
      console.log('Oops something when wrong: ' + JSON.stringify(req));
      return;
    }
    console.log('no handler ' + event);
  },
};

const api = {
  handlers: [
    {
      path: 'msg',
      type: 'post',
      func: req => {
        console.log(req.msg);
      },
    },
  ],
  on: (path, func, type) => {
    socket.handlers.push({ path, func, type });
  },
  endPointSetup: router => {
    api.handlers.forEach(handler => {
      router[handler.type](handler.path, (res, req) => {
        const apiGWCallback = (firstArg, secondArg) => {
          console.log(JSON.stringify(secondArg));
        };
        const apiGWEvent = {
          body: req.body,
        };
        handler.func(apiGWEvent, {}, apiGWCallback);
      });
    });
  },
};

const serverless = {
  read: onFinish => {
    fs.readFile('serverless.yml', 'utf8', (err, data) => {
      // pass env vars and call next thing to do
      onFinish(yaml.safeLoad(data));
    });
  },
  forFunctions: router => {
    return config => {
      // validation exception
      if (!config.functions) {
        console.error('no functions');
        return;
      }
      // for every function entry in sls config file
      Object.values(config.functions).forEach(entry => {
        const handler = entry.handler.split('.');
        // NOTE: Assumes function is a top level method on handler
        const funcName = handler[1];
        let mod = null;
        try {
          mod = require(path.join(__dirname, handler[0]));
        } catch (error) {
          console.error(error);
        }
        if ('websocket' in entry.events[0]) {
          const route = entry.events[0].websocket.route;
          // hook default apiGateway routes into server
          if (route === '$connect') {
            gatewayWs.connect = mod[funcName];
          } else if (route === '$disconnect') {
            // This is not the same as $disconnect which will be
            // triggered by client without 'beforeunload' listener
            socket.on('disconnect', mod[funcName]);
            // NOTE: if in memory connection management is desired
            // add this "on" event for placeholder in init
            // then figure how this event could replace it in handler array
          } else if (route === '$default') {
            gatewayWs.default = mod[funcName];
          } else {
            socket.on(route, mod[funcName]);
          }
        } else if ('http' in entry.events[0]) {
          api.on(
            entry.events[0].http.path,
            mod[funcName],
            entry.events[0].http.method.toLowerCase()
          );
        }
      });
      api.endPointSetup(router);
    };
  },
};

const serve = () => {
  app.use(express.static(path.join(__dirname + '/../public/')));
  const router = express.Router();
  router.get('/:erm', (req, res) => {
    res.status(200);
    res.sendFile(path.join(__dirname + '/../public/index.html'));
  });
  // set up api event handlers
  serverless.read(serverless.forFunctions(router));
  app.use(router);
  const web_server = app.listen(process.env.PORT);
  socket.init(web_server);
};

module.exports = serve;
if (!module.parent) {
  serve();
} // run server if called stand alone

process.once('SIGUSR2', () => {
  mongo.close();
  console.log('nodemon gotta restart em all');
  process.kill(process.pid, 'SIGUSR2');
});
