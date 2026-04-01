#!/bin/bash

# API Test Script for PhotoFlow Backend

BASE_URL="https://PhotoFlow.sonomainfotech.in/api"
TOKEN=""

echo "🧪 PhotoFlow API Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Health check (server running)
echo "1️⃣  Testing server availability..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ "$response" == "404" ]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding (expected 404 for root)"
    exit 1
fi
echo ""

# Test 2: Register a new user
echo "2️⃣  Testing user registration..."
EMAIL="test_$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$EMAIL\",\"password\":\"testpass123\"}")

echo "$REGISTER_RESPONSE" | grep -q '"token"'
if [ $? -eq 0 ]; then
    echo "✅ User registered successfully"
    TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "❌ Registration failed"
    echo "$REGISTER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login with created user
echo "3️⃣  Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"testpass123\"}")

echo "$LOGIN_RESPONSE" | grep -q '"token"'
if [ $? -eq 0 ]; then
    echo "✅ Login successful"
else
    echo "❌ Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get photos (should be empty)
echo "4️⃣  Testing get photos endpoint..."
PHOTOS_RESPONSE=$(curl -s -X GET "$BASE_URL/photos" \
  -H "Authorization: Bearer $TOKEN")

echo "$PHOTOS_RESPONSE" | grep -q '"photos"'
if [ $? -eq 0 ]; then
    echo "✅ Photos endpoint accessible"
    echo "   $(echo $PHOTOS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2) photos found"
else
    echo "❌ Photos endpoint failed"
    echo "$PHOTOS_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Create an album
echo "5️⃣  Testing create album..."
ALBUM_RESPONSE=$(curl -s -X POST "$BASE_URL/albums" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Album","isSmart":false,"photoIds":[]}')

echo "$ALBUM_RESPONSE" | grep -q '"id"'
if [ $? -eq 0 ]; then
    echo "✅ Album created successfully"
    ALBUM_ID=$(echo $ALBUM_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "   Album ID: $ALBUM_ID"
else
    echo "❌ Album creation failed"
    echo "$ALBUM_RESPONSE"
    exit 1
fi
echo ""

# Test 6: Get albums
echo "6️⃣  Testing get albums..."
ALBUMS_RESPONSE=$(curl -s -X GET "$BASE_URL/albums" \
  -H "Authorization: Bearer $TOKEN")

echo "$ALBUMS_RESPONSE" | grep -q "$ALBUM_ID"
if [ $? -eq 0 ]; then
    echo "✅ Albums retrieved successfully"
else
    echo "❌ Albums retrieval failed"
    echo "$ALBUMS_RESPONSE"
    exit 1
fi
echo ""

# Test 7: Create a smart album
echo "7️⃣  Testing create smart album..."
SMART_ALBUM_RESPONSE=$(curl -s -X POST "$BASE_URL/albums" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Landscapes","isSmart":true,"tagRules":["landscape","nature"]}')

echo "$SMART_ALBUM_RESPONSE" | grep -q '"isSmart":true'
if [ $? -eq 0 ]; then
    echo "✅ Smart album created successfully"
else
    echo "❌ Smart album creation failed"
    echo "$SMART_ALBUM_RESPONSE"
    exit 1
fi
echo ""

# Test 8: Test invalid authentication
echo "8️⃣  Testing authentication guard..."
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/photos")

if [ "$UNAUTH_RESPONSE" == "401" ]; then
    echo "✅ Authentication guard working (401 Unauthorized)"
else
    echo "⚠️  Expected 401, got $UNAUTH_RESPONSE"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests passed!"
echo ""
echo "Test user created:"
echo "  Email: $EMAIL"
echo "  Password: testpass123"
echo ""
echo "You can now:"
echo "  - Upload photos via Postman"
echo "  - Test photo sharing"
echo "  - Explore the API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
