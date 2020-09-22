#!/bin/bash
. ./personal.sh # Load private configuration

# Overwite env vars for local testing
export GATSBY_WS_URL="ws://localhost:${PORT}"
export GATSBY_CONTACT_API_URL="http://localhost:${PORT}/dm"
export PORT="8000" # To not conflict with ./serve.sh
# No coflict = nodemon server && gatsby develop work together

# Client side dev flow
gatsby clean
gatsby develop

# mono server dev flow
# gatsby build
# cd serverless/
# nodemon monolithic_server.js