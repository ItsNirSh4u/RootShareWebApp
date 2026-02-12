#!/bin/bash

echo ""
echo "========================================"
echo "  RootShare Feed Seed Script"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Try Docker first (most common setup)
if docker exec -i rootshare-mongodb mongosh "mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin" < "$SCRIPT_DIR/seed-feed.js"; then
    echo ""
    echo "✅ Seed completed via Docker!"
else
    echo ""
    echo "Docker method failed. Trying direct mongosh..."
    mongosh "mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin" "$SCRIPT_DIR/seed-feed.js"
fi

echo ""
echo "========================================"
echo "  Seed script completed!"
echo "========================================"
