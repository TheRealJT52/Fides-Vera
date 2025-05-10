#!/usr/bin/env node

/**
 * This script runs TypeScript type checking with relaxed settings for CI/CD environments
 * It helps work around TypeScript errors in dependencies that we can't modify
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if tsconfig-build.json exists
const buildConfigPath = path.join(__dirname, 'tsconfig-build.json');
if (!fs.existsSync(buildConfigPath)) {
  console.error('Error: tsconfig-build.json not found. Please create it first.');
  process.exit(1);
}

try {
  console.log('Running TypeScript check with build configuration...');
  execSync('npx tsc --project tsconfig-build.json', { stdio: 'inherit' });
  console.log('TypeScript check passed successfully!');
} catch (error) {
  console.error('TypeScript build check failed with relaxed settings.');
  console.error('Please fix the remaining errors before proceeding.');
  process.exit(1);
}