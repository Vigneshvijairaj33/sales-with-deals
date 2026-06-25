#!/bin/bash
echo "=== Setting up DealRadar API Server ==="

# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install git
sudo apt-get install -y git

# Clone the repo
cd /home/ubuntu
git clone https://github.com/Vigneshvijairaj33/sales-with-deals.git
cd sales-with-deals/apps/api

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=http://dealradar-frontend.s3-website.ap-south-1.amazonaws.com
EOF

# Start with PM2
pm2 start dist/index.js --name dealradar-api
pm2 startup
pm2 save

echo "=== Setup Complete! ==="
echo "API running at http://13.206.202.239:3000"
echo "Health check: http://13.206.202.239:3000/health"
