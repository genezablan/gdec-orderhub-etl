#!/bin/bash

# Update Lambda Functions with AWS SDK v3
# This script updates the Lambda functions with the correct AWS SDK

set -e

# Configuration
REGION="${AWS_COGNITO_REGION:-ap-southeast-1}"
FUNCTION_PREFIX="gdec-cognito-auth"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Updating Lambda functions with AWS SDK v3${NC}"

# Function to update Lambda function
update_lambda_function() {
    local function_name=$1
    local source_file=$2
    
    echo -e "${YELLOW}Updating Lambda function: $function_name${NC}"
    
    # Save current directory
    CURRENT_DIR=$(pwd)
    
    # Create a temporary directory for the function
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Copy the source file
    cp "$CURRENT_DIR/scripts/cognito-custom-auth/$source_file" index.js
    
    # Create package.json with AWS SDK v3 dependencies
    cat > package.json << EOF
{
  "name": "$function_name",
  "version": "1.0.0",
  "description": "Cognito Custom Auth Lambda Function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-ses": "^3.0.0"
  }
}
EOF
    
    # Install dependencies
    npm install --production
    
    # Create zip file
    zip -r function.zip .
    
    # Update the function
    aws lambda update-function-code \
        --function-name $function_name \
        --zip-file fileb://function.zip
    
    # Clean up
    cd "$CURRENT_DIR"
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}Updated function: $function_name${NC}"
}

# Update the create-auth-challenge function
update_lambda_function \
    "${FUNCTION_PREFIX}-create-auth-challenge" \
    "create-auth-challenge.js"

echo -e "${GREEN}Lambda function update completed!${NC}"
