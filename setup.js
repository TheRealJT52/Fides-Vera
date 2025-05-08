// Simple setup script to create .env file if it doesn't exist
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
const ENV_EXAMPLE_FILE = path.join(__dirname, '.env.example');

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  // Check if .env.example exists
  if (fs.existsSync(ENV_EXAMPLE_FILE)) {
    // Copy .env.example to .env
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️ Please update your .env file with your API keys!');
  } else {
    // Create basic .env file
    fs.writeFileSync(ENV_FILE, 
`# API Keys
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
`);
    console.log('✅ Created basic .env file');
    console.log('⚠️ Please update your .env file with your API keys!');
  }
} else {
  console.log('ℹ️ .env file already exists');
}

// Display next steps
console.log('\n📋 Next steps:');
console.log('1. Make sure you\'ve installed dependencies with: npm install');
console.log('2. Add your GROQ_API_KEY to the .env file');
console.log('3. Start the development server with: npm run dev\n');

// Check for Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

if (majorVersion < 18) {
  console.log('⚠️ Warning: This project requires Node.js v18 or higher.');
  console.log(`   You are currently using Node.js ${nodeVersion}\n`);
}