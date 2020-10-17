#!/bin/bash
. ./personal.sh

# overwrite env vars for local testing
# export GATSBY_WS_URL="ws://localhost:${PORT}"
export GATSBY_WS_URL="wss://530e44aa4a40.ngrok.io"
export GATSBY_USE_VIDEO="true"

# Build client
gatsby clean
gatsby build

# set server up to test things out
./serve.sh