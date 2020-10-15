// monolithic_server.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const express = require('express');
const app = express();
const path = require('path');
const WebSocket = require('ws');
const yaml = require('js-yaml'); // read serverless.yml file
const fs = require('fs'); // built in file system library
const { startFresh } = require('./db/management');

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
    const { connectionId, responseFunc } = event.requestContext;
    wsConnections.push({
      connectionId,
      responseFunc,
    });
  },
  disconnect: async event => {
    // console.dir(event);
    // reconstruct connection array without this client's connection
    const { connectionId } = event.requestContext;
    wsConnections = wsConnections.filter(
      connection => connection.connectionId !== connectionId
    );
  },
  default: async event => {
    // route has yet to be created
    console.dir(event);
  },
};

const convertMsg = (action, msgObj) => {
  msgObj.action = action;
  let msg = '';
  try {
    msg = JSON.stringify(msgObj);
  } catch (error) {
    console.log(error);
  }
  return msg;
};

const sendTo = async (oid, action, msgObj = {}, event) => {
  console.log(
    `sending event initialized by ${event.requestContext.connectionId}`
  );
  const msg = convertMsg(action, msgObj);
  socket.server.clients.forEach(client => {
    if (client.connectionId === oid && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
  return true;
};

// broadcast to everyone except for connection that initialized
const broadcast = async (oid, action, msgObj = {}, event) => {
  // TODO use db to keep track of monolith clients
  console.log(
    `broadcast event initialized by ${event.requestContext.connectionId}`
  );
  const msg = convertMsg(action, msgObj);
  socket.server.clients.forEach(client => {
    if (client.connectionId !== oid && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
  return true;
};

const broadcastAll = async(oid, action, msgObj = {}, event) => {
  const msg = convertMsg(action, msgObj);
  socket.server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
  return true;
};

const makeResponse = ws => {
  return async (oid, action, msgObj = {}) => {
    console.log(`Responding to ${oid} with: ${action}`);
    const msg = convertMsg(action, msgObj);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      return true;
    }
    return false;
  };
}

const socket = {
  server: null,
  init: server => {
    socket.server = new WebSocket.Server({
      server,
      autoAcceptConnections: false, // is this a thing?
    });
    socket.server.on('connection', ws => {
      // connection information to hold in memory or persistently
      const connectionId = createOid();
      const respond = makeResponse(ws);
      // Emulate connect event in api gateway
      const gwEvent = {
        requestContext: {
          connectionId,
          respond,
        },
      };
      gatewayWs.connect(gwEvent);
      // handle incoming request
      ws.on('message', message => {
        socket.incoming(message, respond, connectionId);
      });
      ws.connectionId = connectionId;
      ws.on('close', code => {
        console.log(`Client closing with code ${code}`);
        gatewayWs.disconnect({
          ...gwEvent,
          respond,
          sendTo,
          broadcast,
          broadcastAll,
        });
      });
    });
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
  incoming: (event, respond, connectionId) => {
    let req = { action: null };
    // if error we don't care there is a default object
    try {
      req = JSON.parse(event);
    } catch (error) {
      console.log(error);
    }
    // find handler we are looking for
    const endpoint = socket.handlers.find(
      handler => req.action === handler.action
    );
    if (endpoint) {
      console.log(`endpoint = ${endpoint.action}`);
      endpoint.func({
        body: event,
        requestContext: {
          connectionId,
        },
        // not an api gateway properties
        sendTo,
        respond,
        broadcast,
        broadcastAll,
      });
    } else {
      console.log(`no handler: ${req.action}`);
    }
    if (req.message === 'Internal server error') {
      console.log(`Server error: ${req.action}`);
      return;
    }
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
            gatewayWs.disconnect = mod[funcName];
            // This is not the same as $disconnect which will be
            // triggered by client without 'beforeunload' listener
            // socket.on('disconnect', mod[funcName]);
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

// Its async so it'll read ctrl-c as long as you're pressing the thing.
let processShutingDown = false;

process.once('SIGUSR2', async () => {
  if (processShutingDown) {
    return;
  }
  processShutingDown = true;
  console.log('nodemon gotta restart em all - but lets reset the db first');
  // pass this function the only communication methods it can use without a connectionId
  await startFresh({
    sendTo,
    broadcastAll,
  });
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  if (processShutingDown) {
    return;
  }
  processShutingDown = true;
  console.log('  -- oh noes you are ctrl C-ing me again!');
  await startFresh({
    sendTo,
    broadcastAll,
  });
  process.exit(0);
});
