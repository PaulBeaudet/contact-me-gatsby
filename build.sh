#!/bin/bash
. ./personal.sh

# overwrite env vars for local testing
# export GATSBY_WS_URL="ws://localhost:${PORT}"
export GATSBY_WS_URL="wss://4290a02f0bbd.ngrok.io"

# Build client
gatsby clean
gatsby build

# set server up to test things out
./serve.sh