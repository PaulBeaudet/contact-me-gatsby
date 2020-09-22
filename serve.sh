#!/bin/bash
. ./personal.sh # Load private configuration

cd serverless/
nodemon monolithic_server.js