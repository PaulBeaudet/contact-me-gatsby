#!/bin/bash
. ./personal.sh # Load private configuration

# Build 
gatsby clean
gatsby build

# Creat bucket and such
#aws s3 mb s3://$BUCKET_NAME
#aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document page-data/404.html

# Sync to S3
echo "syncing website to $BUCKET_NAME"
aws s3 sync build/ s3://$BUCKET_NAME/ --delete --exclude "*.sh"
echo "done syncing"

# deploy sereverless functions assosiated with this app
# cd serverless/
# serverless deploy --aws-profile deabute
# echo "Done deploying serverless functions"
