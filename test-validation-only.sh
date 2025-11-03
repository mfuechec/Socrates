#!/bin/bash
# Test API validation without needing a real API key

echo "Starting dev server..."
cd /Users/mfuechec/Desktop/Gauntlet\ Projects/Socrates

# Start dev server in background
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Run tests
echo "Running API validation tests..."
node test-api.js

# Kill dev server
echo "Stopping dev server..."
kill $DEV_PID

echo "Done!"
