#!/bin/bash

# Network Identity Manager Demo Script

set -e

echo "🚀 Network Identity Manager Demo"
echo "=================================="
echo ""

BASE_URL="http://localhost"

# Check if services are running
if ! curl -s $BASE_URL/health > /dev/null; then
    echo "❌ Services not running. Please start with: docker compose up -d"
    exit 1
fi

echo "✅ Services are running"
echo ""

# Test 1: Registration
echo "📝 Test 1: User Registration"
echo "-----------------------------"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123!@#",
    "firstName": "Demo",
    "lastName": "User"
  }')

echo "Response: $REGISTER_RESPONSE"
echo ""

# Test 2: Login
echo "🔐 Test 2: User Login"
echo "---------------------"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123!@#"
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
    echo "🎫 Token extracted successfully"
    
    # Test 3: Get Profile
    echo ""
    echo "👤 Test 3: Get User Profile"
    echo "---------------------------"
    PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/users/profile)
    echo "Response: $PROFILE_RESPONSE"
    echo ""
else
    echo "❌ Login failed"
fi

# Test 4: Health Check
echo "🏥 Test 4: Health Check"
echo "-----------------------"
HEALTH_RESPONSE=$(curl -s $BASE_URL/health)
echo "Response: $HEALTH_RESPONSE"
echo ""

echo "✅ Demo completed successfully!"
echo ""
echo "📋 Available endpoints:"
echo "  - GET  /health              - Health check"
echo "  - GET  /                    - Application info"
echo "  - POST /api/auth/register   - User registration"
echo "  - POST /api/auth/login      - User login"
echo "  - GET  /api/users/profile   - Get user profile (authenticated)"
echo "  - PUT  /api/users/profile   - Update user profile (authenticated)"
echo "  - PUT  /api/users/password  - Change password (authenticated)"
echo ""
echo "📧 Email Features (Microsoft Graph):"
echo "  - Welcome emails with verification links"
echo "  - Password reset emails"
echo "  - Login notification emails"
echo ""
echo "🔧 Configure Microsoft Graph:"
echo "  1. Set AZURE_CLIENT_ID in .env"
echo "  2. Set AZURE_CLIENT_SECRET in .env"
echo "  3. Set AZURE_TENANT_ID in .env"
echo "  4. Restart services: docker compose restart"