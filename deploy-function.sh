#!/bin/bash

# Quick script to deploy ONLY the Netlify Function
# This fixes the 404 error for /api/* endpoints

echo "=== Deploying Netlify Function ==="
echo ""
echo "This will deploy the proxy function to fix API 404 errors"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo "❌ Netlify CLI not found!"
  echo ""
  echo "Installing Netlify CLI..."
  npm install -g netlify-cli
  echo ""
fi

# Check if logged in
echo "Checking Netlify login..."
if ! netlify status &> /dev/null; then
  echo "Please login to Netlify:"
  netlify login
  echo ""
fi

# Check if site is linked
if ! netlify status &> /dev/null || [ -z "$(netlify status 2>/dev/null | grep 'Site id')" ]; then
  echo "Linking to Netlify site..."
  echo "Select your site: hilarious-gingersnap-b05848"
  netlify link
  echo ""
fi

# Deploy the function
echo "Deploying proxy function..."
netlify functions:deploy proxy --dir=netlify/functions

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Function deployed successfully!"
  echo ""
  echo "Test it: https://hilarious-gingersnap-b05848.netlify.app/api/midland/auth/admin/login"
  echo ""
else
  echo ""
  echo "❌ Deployment failed!"
  echo "Try: netlify functions:deploy proxy"
fi

