#!/bin/bash

. ./dev_config.sh
# Not that being set at all equals true
export CYPRESS_guest="TRUE"

npx cypress open