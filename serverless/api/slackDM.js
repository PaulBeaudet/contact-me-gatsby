const { request } = require('https');
const { _200, parseBody, _400 } = require('./gatewaySocketAdapter');

const slackDm = (msg, path = process.env.DM_WH) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ text: msg });
    const options = {
      hostname: 'hooks.slack.com',
      port: 443,
      method: 'POST',
      path,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };
    const req = request(options, resolve);
    // just do it, no need for response
    req.on('error', error => {
      console.log(`Slack DM Request issue: ${error}`);
      reject();
    });
    req.write(postData);
    req.end();
  });
};

const relay = async event => {
  const body = parseBody(event.body);
  if (!body) {
    return _400();
  }
  const { msg } = body;
  console.log(`sending message ${msg}`);
  await slackDm(msg);
  return _200();
};

module.exports = {
  relay,
};
