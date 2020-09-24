#!/bin/bash
. ./personal.sh # Load private configuration

export MONOLITH="true"
cd serverless/
nodemon monolithic_server.js