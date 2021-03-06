#!/bin/bash
. ./dev_config.sh

# overwrite env vars for local testing
# LOCAL_LAN_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')
# export GATSBY_WS_URL="ws://${LOCAL_LAN_IP}:${PORT}"

# Build client
gatsby clean
gatsby build

# startup server
cd serverless/
npm start