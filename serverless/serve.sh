#!/bin/bash
# npm run clear-logs
npm run stop
cd ../
. ./dev_config.sh
cd serverless/
npm run startup
# npm run logs