#!/bin/bash
. ./personal.sh

# overwrite env vars for local testing
export GATSBY_WS_URL="ws://localhost:3003"
export GATSBY_CONTACT_API_URL="http://localhost:${PORT}/dm"

# Build client
gatsby clean
gatsby build

# set server up to test things out
./serve.sh