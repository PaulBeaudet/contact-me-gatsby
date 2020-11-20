#!/bin/bash
. ./personal.sh # Load private configuration

export MONOLITH="true"
# Use a different db than prod
export DB_NAME="dev"
# monoprocesses=`ps aux | grep "monolithic_server.js" | grep "node" | awk '{print $2}'`
# [ "$monoprocesses" ] && kill -9 $monoprocesses
npm run stop-server
cd serverless/
pm2 start monolithic_server.js --watch