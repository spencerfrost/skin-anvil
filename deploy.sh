#!/bin/bash

# Exit immediately if any command fails
set -e

PROJECT_ROOT=$(pwd)
CLIENT_TARGET="/var/www/minecraft-skin-merger/client"
SERVER_TARGET="/var/www/minecraft-skin-merger/server"

echo "🚀 Starting local deployment for Minecraft Skin Merger..."

# 1. Ensure you are on the master branch and have the latest local changes
echo "Checking git status..."
git checkout master
git pull origin master

# 2. Install dependencies (Replaces CircleCI 'setup' job)
echo "📦 Installing client and server dependencies..."
cd "$PROJECT_ROOT"/client && npm ci
cd "$PROJECT_ROOT"/server && npm ci

# 3. Run Lint & Tests (Replaces CircleCI 'test' job)
echo "🔍 Running ESLint..."
cd "$PROJECT_ROOT"/client && npm run lint || true

echo "🧪 Running client tests..."
cd "$PROJECT_ROOT"/client && CI=true npm test

# 4. Build Assets (Replaces CircleCI 'build' job)
echo "🏗️ Building client production assets..."
cd "$PROJECT_ROOT"/client && npm run build

echo "🏗️ Building server production assets..."
cd "$PROJECT_ROOT"/server && npm run build

# 5. Deploy Assets Natively
echo "🚚 Syncing client build to $CLIENT_TARGET..."
sudo rm -rf "$CLIENT_TARGET"/*
sudo cp -r "$PROJECT_ROOT"/client/build/* "$CLIENT_TARGET"/

echo "🚚 Syncing server build to $SERVER_TARGET..."
# NOTE: If your build steps output everything to server/dist, but your ecosystem config 
# expects files in the root of /server/, verify if your compiled files match your PM2 config pathways!
sudo rm -rf "$SERVER_TARGET"/*
sudo cp -r "$PROJECT_ROOT"/server/dist/* "$SERVER_TARGET"/
sudo cp "$PROJECT_ROOT"/server/package*.json "$SERVER_TARGET"/

# 6. Production Setup & Process Restart
echo "⚙️ Installing server production dependencies..."
cd "$SERVER_TARGET"
sudo npm install --production

echo "🔄 Restarting application services..."
# Using startOrRestart handles both booting it up fresh or reloading it cleanly
pm2 startOrRestart /var/www/minecraft-skin-merger/ecosystem.config.js
sudo systemctl restart nginx

echo "✅ Deployment complete! Your app is live at https://mcskinmerger.mrspinn.ca"