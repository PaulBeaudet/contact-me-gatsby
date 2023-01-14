#!/bin/bash

. ./prod_config.sh

domain="$BUCKET_NAME"

# # Remove S3 Bucket
# echo "Removing s3 bucket"
# aws s3 rb "s3://${BUCKET_NAME}" --force

dist_id=$(aws cloudfront list-distributions | jq --arg domain "$domain" '(
  .DistributionList.Items[] | 
  select(.Aliases.Items[] | contains($domain)) | 
  .Id
)')

echo "Remove Cloudfront resource ${dist_id}"
aws cloudfront delete-distribution --id "$dist_id"

# echo "Clean up API Gateway Resources" This should be done with serverless framework
# aws apigateway get-domain-names # WSS is potentially used for other resources so we wont touch it

# hosted_zone=$(aws route53 list-hosted-zones | jq '(
#   .HostedZones[] | select(.Name == "deabute.com.") |
#   .Id
# )')
# zone_id=$(echo "$hosted_zone" | awk -F '/' '{print $3}')
# aws route53 list-resource-record-sets --hosted-zone-id "$zone_id" --start-record-name deabute.com
# echo "Remove DNS Entries from route 53 ${zone_id}"