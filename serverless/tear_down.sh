#!/bin/bash 
# Tear down Lambda functions with serverless
. .././prod_config.sh
echo "Lambda function tear down"
sls remove --aws-profile "$AIM_PROFILE" # AKA IAM_PROFILE, AIM profile was something like ***Lolz love my friends forever!***
