#!/bin/bash
# Replace ${GITHUB_TOKEN} placeholder in package.json at build time
sed -i "s/\${GITHUB_TOKEN}/$GITHUB_TOKEN/g" package.json
