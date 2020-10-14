#!/bin/bash
. ./personal.sh # Load private configuration

Build 
gatsby clean
gatsby build

# Creat bucket and such (Not fully automated yet)
# echo "Creating bucket with static public website settings"
# aws s3 mb s3://$BUCKET_NAME
# aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document page-data/404.html

# I pulled a policy from a public bucket I already had and replaced the bucket name manually
# aws s3api get-bucket-policy --bucket $BUCKET_NAME --query Policy --output text > bucket_policy.json
# aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket_policy.json

# Sync to S3
echo "syncing website to $BUCKET_NAME"
aws s3 sync public/ s3://$BUCKET_NAME/ --delete --exclude "*.sh"
echo "done syncing"

# Set up a cloudfront distribution
# I copied the config from a previously working distribution
# Doing a manual find and replace on the sub-domain/bucket-name
# aws cloudfront get-distribution-config --id "distributionId" > distribution-config.json
# The above command doesn't provide a great config file I had to piece together parts of it
# To make the one that worked
# aws cloudfront create-distribution --distribution-config file://distconfig.json

# Make sure a route 53 route is set point at the cloudfront distribution

# deploy sereverless functions assosiated with this app
# cd serverless/
# serverless deploy --aws-profile deabute
# echo "Done deploying serverless functions"
