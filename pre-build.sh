#!/bin/bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN is not set in Amplify environment variables"
  exit 1
fi

TOKEN_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/"

git config --global --add url."${TOKEN_URL}".insteadOf "https://github.com/"
git config --global --add url."${TOKEN_URL}".insteadOf "ssh://git@github.com/"
git config --global --add url."${TOKEN_URL}".insteadOf "git@github.com:"
