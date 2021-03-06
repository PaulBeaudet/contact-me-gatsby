// monolithic_server.js ~ Copyright 2019-2020 Paul Beaudet ~ MIT License
const express = require('express');
const app = express();
const path = require('path');
const WebSocket = require('ws');
const yaml = require('js-yaml'); // read serverless.yml file
const fs = require('fs'); // built in file system library
const { startFresh } = require('./db/management');
const { createOid } = require('../isomorphic/oid');

// placeholder methods can be over written by serverless forFunctions
const gatewayWs = {
  connect: ()=>{},
  disconnect: ()=>{},
  default: ()=>{},
}

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

let wsServer = null;

const sendTo = async (connectionId, action, msgObj = {}) => {
  const msg = convertMsg(action, msgObj);
  wsServer.clients.forEach(client => {
    if (client.connectionId === connectionId && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
  return true;
};

// broadcast to everyone except for connection that initialized
const broadcast = async (connectionId, action, msgObj = {}) => {
  // TODO use db to keep track of monolith clients
  console.log(`broadcast from ${connectionId}`);
  const msg = convertMsg(action, msgObj);
  wsServer.clients.forEach(client => {
    // sending to everyone besides sender
    if(client.connectionId === connectionId){
      return;
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    } else {
      console.log(`skipping client ${client.connectionId}`)
    }
  });
  return true;
};

const broadcastAll = async(connectionId, action, msgObj = {}) => {
  console.log(`broadcast from ${connectionId}`);
  const msg = convertMsg(action, msgObj);
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }  else {
      console.log(`skipping client ${client.connectionId}`)
    }
  });
  return true;
};

const wsOn = (action, func) => {
  wsHandlers.push({ action, func });
};

const wsHandlers = [{
  action: 'msg',
  func: req => {
    console.log(req.msg);
  }
}];

// handle incoming socket messages
const incoming = (event, connectionId) => {
  let req = { action: null };
  // if error we don't care there is a default object
  try {
    req = JSON.parse(event);
  } catch (error) {
    console.log(error);
  }
  // find handler we are looking for
  const endpoint = wsHandlers.find(
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
};

const initSocketServer = server => {
  wsServer = new WebSocket.Server({
    server,
    autoAcceptConnections: false, // is this a thing?
  });
  wsServer.on('connection', ws => {
    // connection information to hold in memory or persistently
    const connectionId = createOid();
    // Emulate connect event in api gateway
    const gwEvent = {
      requestContext: {
        connectionId,
      },
    };
    gatewayWs.connect(gwEvent);
    // handle incoming request
    ws.on('message', message => {
      incoming(message, connectionId);
    });
    ws.connectionId = connectionId;
    ws.on('close', code => {
      console.log(`Client closing with code ${code}`);
      gatewayWs.disconnect({
        ...gwEvent,
        sendTo,
        broadcast,
        broadcastAll,
      });
    });
  });
};

const restHandlers = [{
  path: 'msg',
  type: 'post',
  func: req => {
    console.log(req.msg);
  }
}];

const restOn = (path, func, type) => {
  restHandlers.push({ path, func, type });
};

const restEndPointSetup = router => {
  restHandlers.forEach(handler => {
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
};

const loadServiceConfig = onFinish => {
  fs.readFile('serverless.yml', 'utf8', (err, data) => {
    // pass env vars and call next thing to do
    onFinish(yaml.safeLoad(data));
  });
}

// function that sets up each service loaded from config
const setService = router => {
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
          wsOn(route, mod[funcName]);
        }
      } else if ('http' in entry.events[0]) {
        restOn(
          entry.events[0].http.path,
          mod[funcName],
          entry.events[0].http.method.toLowerCase()
        );
      }
    });
    restEndPointSetup(router);
  };
};


const serve = () => {
  app.use(express.static(path.join(__dirname + '/../public/')));
  const router = express.Router();
  router.get('/:erm', (req, res) => {
    res.status(200);
    res.sendFile(path.join(__dirname + '/../public/index.html'));
  });
  // set up api event handlers
  loadServiceConfig(setService(router));
  app.use(router);
  const web_server = app.listen(process.env.PORT);
  initSocketServer(web_server);
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
