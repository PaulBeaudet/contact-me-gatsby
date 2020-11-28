# Contact

This statically generated site gives ways to contact its Author.

- Via text: Slack integration
- Via Audio: WebRTC, can be configured to default to audio only
- Via Video: WebRTC, if client capable

## Setup

### Universal prep

- Install Node 14.x+ (via NVM or Node-source)
- npm install at the top level directory and in the serverless folder
- in top level directory "npm run install-globals": install global dependencies
- cp example_config.sh into a file called dev_config.sh or prod_config.sh and modify with desired configuration for either environment
- Create a MongoDB instance with a valid host user doc in "users" collection
  - NOTE: currently the password needs to be hashed by hand
- Authorize an access url for MongoDB: Take note for env var in above config file

### Local Development setup

- Install ngrok: getUserMedia() + rtc connection require TLS in popular browsers. Serving in plaintext behind a NAT is insufficient.
- Run ngrok: Take note of generated url
- Modify dev_config.sh so it at least includes the following
  - ngrok url part: After http:// --> right-here.ngrok.io <--
  - Mongo URI
  - STUN servers (There are public ones)
  - Slack Webhook
- Run "npm start"
  - this will also run npm start in serverless sub directory
  - In dev there is a monolithic WebSocket server that loads the serverless functions.
  - pm2 will watch for server changes and reload on change.
  - pm2 Daemon is stopped by running "npm stop" in serverless directory.

### Development updates

run "npm start" in top level directory with valid dev_config.sh available.

- Note that ngrok URL will need to be updated every time it is brought down and back up.

### Production setup

Planning to eventually automate the set-up steps, but it's far from it right now so plan on some quality time with the aws-cli or their web interface.

- refer to more in depth details in awsDeploy.sh
- For an overview of set up task
  - Sync build folder to S3
  - Set S3 folder up as a static website
  - Set up Cloudfront to serve that site over TLS
  - Set up Route 53 to point a domain name at Cloudfront distribution
  - Set up API Gateway with a WebSocket route that matches the set production config

### Deployment updates

run ./awsDeploy.sh with valid prod_config.sh available.

## Notes on client side frameworks and libraries

### Gatsby

This static site is generated via the Gatsby-js framework. In retrospect Gatsby is probably not the best tool for this particular application. At the project onset it was more of a learning experiment because a statically generated site is desirable. Gatsby is good for medium sized content heavy sites that are generated from one or many sources of information. Particularly where the developer wants to use React-js to structure components of the site and GraphQL to query content.

The nature of how Gatsby pre-compiles code assumes all DOM manipulation to be managed by the shadow DOM. Making it a bit kludgy to use with things like a third party authentication libraries or WebRTC. Libraries or components that assume the existence of browser based objects like window, document or navigator fail in a pre-compilation step that uses Nodejs. With the Node interpreter lacking those browser globals. This issue requires conditional wrappers to check for those types of objects before using them in an expected way.

It's nice Gatsby's includes AST tools like the typescript compiler, however the default configurations are geared towards Gatsby's use cases or architecture. One example of this is typing in typescript files not being strictly required. Overall Gatsby is a powerful tool that can be applied many use cased outside of statically generated blogs. However, do it again, other options would be considered for this particular application. The heft of the required libraries and compilation times have been undesirable for a short development trial and error loops as it often takes minutes to generate a significantly complex website. Included is a Hot Module Reloading tool, unfortunately this misses compilation bugs with unwrapped browser objects.

### Serverless & API Gateway

The production version of the app is built with scale in mind after some trials and errors with a classic 3 tier architecture. Of course scale is not a necessary in single host setup. However the original application the backend was based on was design to have multiple host. Negotiating WebRTC handshakes for one host is a low traffic concept that could be handled by a free heroku server it wasn't for the sleep and slow start-up times. Both of with would interfere with how the original application worked. The development and production need drove a hybrid approach that allows for development to be run in a 3 tier setup and production to be service oriented in the context of serverless functions.

Production operational architecture

- AWS Lambda handles api endpoints
- AWS API Gateway handles incoming and outgoing WebSocket Connections.
- MongoDB Stores active Websocket connections, Account information, host availability, and Communication Matches.
- AWS S3 Stores and Serves a static website generated by Gatsby.
- AWS Cloudfront caches and securely serve the static site with a domain cert.
- AWS Route 53 provides DNS routing to the Cloudfront distribution.

Production functional architecture overview

- Host signs in: WS endpoint "login"
- Host allows media via getUserMedia
- Host sets their availability: WS endpoint SetAvail
- Visitor visits host's page: WS endpoint "GetAvail"
- Visitor allows media via getUserMedia: if host available
- Visitor connects call: WS endpoint "Offer"
- Host automatically responds with answer: WS endpoint "Answer"
- ICE after SDP gathered: WS endpoint "ICE"
- Call connects if ICE found a common path for direct a peer-to-peer connection
  - Note that this application as typically been only used with STUN servers for privacy reasons. Sure clients are giving up their direct routing information to each other, but once connected direct calls are encrypted end to end with DTLS without the need for another layer of end to end encryption to obscure from a Signal Forwarding Unit.
- Call are ended with WS endpoint "End": Future end through peer data channel.
  - The predecessor application did a number of functions though a WebRTC data channel including "end call".

For multiple host and just a sole host this application's infrastructure configuration has a few advantages.

- Application cost \$0.50/month at rest
- Scales into high thruput multi-tenant future without rebuilding infrastructure when socket connections hit hardware capacity.

Cons

- Lambda functions are slow which in turn slows down the time it takes to do the WebRTC handshake. This is true even with the fastest tier of lambda, which is being used to make the application functional in production. If the handshake is too slow the client's local RTCPeerConnection will timeout expecting ICE Candidates.
