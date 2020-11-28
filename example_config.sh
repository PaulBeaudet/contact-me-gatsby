#!/bin/bash
# note that env vars proceeded with "#*" need to be valid configuration
# --- AWS S3 ---
# Bucket name where static site is hosted
export BUCKET_NAME="your.bucket.com" #* if deploying (deployment setup still need documenting)
export AIM_PROFILE="your_profile" # if profile option is removed it does have a default one
# probably best to be explicit about where infrastructure is being deployed

# --- Monolith config ---
export PORT="3002"

# ---- NGROK Base URL ----
export NGROK_URL="*your-ngrok-instance*.ngrok.io" #*

# --- Gatsby env vars ---
export GATSBY_SITE_TITLE="Contact"
export GATSBY_SITE_DESCRIPTION="Contact information and interface for a personal website"
export GATSBY_SITE_AUTHOR="Example Author"
export GATSBY_ICE_SERVER_1="your-stun-server" #*
export GATSBY_ICE_SERVER_2="your-stun-or-turn-server" #*
export GATSBY_WS_URL="wss://$NGROK_URL"
export GATSBY_USE_VIDEO="true"
export GATSBY_REPO_URL="https://github.com/PaulBeaudet/contact-me-gatsby"

# --- Mongo env vars ---
export DB_NAME="dev"
export MONGODB_URI="maybe-set-up-an-instance-with-mongo-atlas?" #*

# --- monolith config ----
export ENDPOINT_ROUTE="/signal"
export DM_WH="https://hooks.slack.com/services/*your-slack-webhook*" #*
# Email of user that gets looked up when checking availability
export HOST_EMAIL="example@example.com" #* Will be deprecated with multi-tenency
export MONOLITH="true"

# --- Cypress ---
export CYPRESS_BASE_URL="https://$NGROK_URL"
export CYPRESS_WS_URL=$GATSBY_WS_URL
export CYPRESS_email=$HOST_EMAIL
export CYPRESS_password="testing_login_password" #* if testing
