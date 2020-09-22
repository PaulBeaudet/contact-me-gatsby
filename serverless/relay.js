const { request } = require('https');

const slack = {
  send: (msg, webhook) => {
    const postData = JSON.stringify({ text: msg });
    const options = {
      hostname: 'hooks.slack.com',
      port: 443,
      method: 'POST',
      path: webhook ? webhook : process.env.DM_WH,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };
    const req = request(options, () => {});
    // just do it, no need for response
    req.on('error', error => {
      console.log(error);
    });
    req.write(postData);
    req.end();
  },
  dm: (event, context, callback) => {
    const response = {
      statusCode: 200,
      headers: {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
    try {
      event.body = JSON.parse(event.body);
    } catch (error) {
      console.log(error);
      response.statusCode = 400;
    }
    if (response.statusCode === 200) {
      console.log('event text:' + event.body.text);
      slack.send(event.body.text);
    }
    callback(null, response);
  },
};

exports.slack = slack.dm;
