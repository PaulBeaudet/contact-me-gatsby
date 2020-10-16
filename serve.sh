#!/bin/bash
. ./personal.sh # Load private configuration

export MONOLITH="true"
monoprocesses=`ps aux | grep "monolithic_server.js" | grep "node" | awk '{print $2}'`
[ "$monoprocesses" ] && kill -9 $monoprocesses
cd serverless/
nodemon monolithic_server.js