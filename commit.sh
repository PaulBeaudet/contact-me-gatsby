#!/bin/bash

# Copy over important things to dropbox but not bs
rsync -rac \
--exclude= .git \
--exclude= .cache \
--exclude='node_modules' \
--exclude='public' \
--delete \
./ \
$HOME/Dropbox/programs/react/contact-me-gatsby
# End rsync ... wish passing --exclude-from= .gitignore worked

# Only push on passed commit message
if [ "$1" ]; then
    git add .
    git commit -m "$1"
    git push
fi
