#!/bin/bash

# Test script for notify-waitlist admin route
# Make sure you have at least one email in the waitlist first!

ADMIN_PASSWORD="${ADMIN_PASSWORD:-change-me-in-production}"
PORT="${PORT:-9004}"

echo "🧪 Testing /api/admin/notify-waitlist"
echo "Using admin password: ${ADMIN_PASSWORD:0:5}..."
echo ""

curl -X POST "http://localhost:${PORT}/api/admin/notify-waitlist" \
  -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "✅ Test complete!"





