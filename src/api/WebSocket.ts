let instance = null;

export const init = (onConnection: () => void) => {
  if (instance) {
    // makes it so that init function can be called l
    // liberally to assure that we are maintaining connection
    if (onConnection) {
      onConnection();
    }
  } else {
    instance = new WebSocket(process.env.GATSBY_WS_URL);
    instance.onopen = () => {
      instance.onmessage = incoming;
      instance.onclose = () => {
        instance = null;
      };
      if (onConnection) {
        onConnection();
      }
    };
  }
};

const handlers = [
  {
    action: 'msg',
    func: (req: any) => {
      console.log(req.msg);
    },
  },
];

export const wsOn = (action: string, func: any) => {
  handlers.push({ action, func });
};

const incoming = (event: any) => {
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

export const wsSend = (action: string, json: any) => {
  json = json ? json : {};
  json.action = action;
  let msg = '{"action":"error","error":"failed stringify"}';
  try {
    msg = JSON.stringify(json);
  } catch (error) {
    console.log(error);
  }
  init(() => {
    instance.send(msg);
  });
};
