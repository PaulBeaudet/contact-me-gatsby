#!/bin/bash
. ./personal.sh

# overwrite env vars for local testing
export GATSBY_USE_VIDEO="true"
# export GATSBY_WS_URL="ws://localhost:${PORT}"
export GATSBY_WS_URL="wss://02c3d151d91a.ngrok.io "
export GATSBY_CONTACT_API_URL="http://localhost:${PORT}/dm"

# Build client
gatsby clean
gatsby build

# set server up to test things out
./serve.sh