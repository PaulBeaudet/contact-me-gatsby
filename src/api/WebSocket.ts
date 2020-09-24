// WebSocket.ts Copyright 2020 Paul Beaudet MIT License

// WebSocket object used to send and receive messages
let instance = null;

// init gets called whenever client tries to send a message.
// So its not really necessary to call it externally.
const init = (onConnection: () => void = () => {}) => {
  if (instance) {
    // makes it so that init function can be called
    // liberally to assure that we are maintaining connection
    // API Gateway kicks connections after a short while
    onConnection();
  } else {
    instance = new WebSocket(process.env.GATSBY_WS_URL);
    instance.onopen = () => {
      instance.onmessage = incoming;
      instance.onerror = console.log;
      instance.onclose = () => {
        instance = null;
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          wsSend('disconnect');
        });
      }
      onConnection();
    };
  }
};

// This is a list of events the app is listening for.
// Abstracting this outside of the initial connection
// event allows a variable amount of handlers to be added.
// Plus they can be added where they logically make sense in the code
const handlers = [
  {
    action: 'msg',
    func: (req: any) => {
      console.log(req.msg);
    },
  },
];

// shortcut for adding an event handler
export const wsOn = (action: string, func: any) => {
  handlers.push({ action, func });
};

// Listener for all incoming socket messages
const incoming = (event: any) => {
  console.log(`incoming event: ${event}`);
  let req = { action: null };
  // if error we don't care there is a default object
  try {
    req = JSON.parse(event.data);
  } catch (error) {
    console.log(error);
  }
  if (
    !handlers.find(handler => {
      if (req.action === handler.action) {
        // maybe delete action key here
        handler.func(req);
        return true;
      }
    })
  ) {
    // given no handler found in array
    console.log('no handler ' + event.data);
  }
};

// Outgoing socket messages from client
export const wsSend = (action: string, json: any = {}) => {
  json.action = action;
  let msg = '{"action":"error","error":"failed stringify"}';
  try {
    msg = JSON.stringify(json);
  } catch (error) {
    console.log(error);
  }
  // create socket connection if its not yet connected
  init(() => {
    instance.send(msg);
  });
};
