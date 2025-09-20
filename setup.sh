#!/bin/bash

echo ""
echo "🧠 BrainJam Arena - Automated Setup"
echo "===================================="
echo "🎯 Train. Compete. Conquer the Code."
echo ""

echo "⏳ Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    read -p "Press Enter to continue..."
    exit 1
fi
echo "✅ Dependencies installed successfully!"
echo ""

echo "⏳ Step 2: Setting up environment..."
if [ ! -f .env ]; then
    echo "📝 Creating .env configuration file..."
    cat > .env << EOF
NODE_ENV=development
PORT=3000

# Database Configuration - Auto-detects both MySQL ports
DB_HOST=localhost
DB_PORT=3306,4306
DB_USER=root
DB_PASSWORD=
DB_NAME=brain_jam

# JWT Security
JWT_SECRET=brain-jam-super-secret-key-change-in-production
JWT_EXPIRE=24h
EOF
    echo "✅ Environment configuration created!"
    echo "💡 The app will auto-detect MySQL on ports 3306 and 4306 (XAMPP)"
else
    echo "✅ Environment configuration already exists."
fi
echo ""

echo "⏳ Step 3: Initializing database..."
echo "💡 Attempting to connect to MySQL on ports 3306 and 4306..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "❌ Database initialization failed"
    echo "💡 Make sure MySQL or XAMPP is running"
    echo "🔧 For XAMPP: Start Apache + MySQL in XAMPP Control Panel"
    read -p "Press Enter to continue..."
    exit 1
fi
echo "✅ Database initialized successfully!"
echo ""

echo "⏳ Step 4: Starting BrainJam Arena..."
echo "🔍 Server will check ports 3000 and 3001 for availability"
echo "📄 Pages:"
echo "   • Home: http://localhost:[3000 or 3001]"
echo "   • Register: http://localhost:[3000 or 3001]/register"
echo "   • Login: http://localhost:[3000 or 3001]/login"
echo ""
echo "🛡️ Features Ready:"
echo "   ✅ User Registration & Login"
echo "   ✅ JWT Authentication"
echo "   ✅ Military Rank System"
echo "   ✅ Multi-Port MySQL Support"
echo "   ✅ Responsive Dark Theme"
echo "   ✅ Smart Port Selection (3000/3001 only)"
echo ""
echo "🔄 Server will use port 3000 or 3001 only"
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev

read -p "Press Enter to exit..."
