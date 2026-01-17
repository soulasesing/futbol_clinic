#!/usr/bin/env node
/**
 * Futbol Clinic - Vercel Deployment Setup
 * Simple script to help with the deployment setup
 */

console.log('🚀 Futbol Clinic - Vercel Deployment Setup');
console.log('==========================================\n');

const fs = require('fs');
const path = require('path');

const projectRoot = path.dirname(__dirname);

console.log('📋 Deployment Setup Checklist:\n');

// Check if environment files exist
const envLocalExample = path.join(projectRoot, 'env.local.example');
const envLocal = path.join(projectRoot, '.env.local');

if (fs.existsSync(envLocalExample)) {
  console.log('✅ env.local.example found');
  
  if (!fs.existsSync(envLocal)) {
    console.log('📝 Next: Copy env.local.example to .env.local and configure it');
    console.log('   Command: cp env.local.example .env.local');
  } else {
    console.log('✅ .env.local exists');
  }
} else {
  console.log('❌ env.local.example not found');
}

console.log('');
console.log('🎯 Deployment Steps:');
console.log('====================');
console.log('');
console.log('1. 🏠 LOCAL SETUP:');
console.log('   • Make sure PostgreSQL is running');
console.log('   • Copy env.local.example to .env.local');
console.log('   • Edit .env.local with your database credentials');
console.log('   • Run migrations: psql [connection] -f run_migrations.sql');
console.log('');
console.log('2. ☁️ SUPABASE SETUP:');
console.log('   • Create project at supabase.com');
console.log('   • Get connection string from Settings → Database');
console.log('   • Run migrations in Supabase SQL Editor');
console.log('');
console.log('3. 🚀 VERCEL DEPLOYMENT:');
console.log('   • Install Vercel CLI: npm install -g vercel');
console.log('   • Deploy: vercel');
console.log('   • Configure environment variables in Vercel dashboard');
console.log('   • Use env.production.example as reference');
console.log('');
console.log('📁 Files Ready:');
console.log('   • vercel.json (updated for monorepo)');
console.log('   • DEPLOYMENT.md (complete guide)');
console.log('   • env.local.example (local development)');
console.log('   • env.production.example (Vercel env vars)');
console.log('');
console.log('🔗 Links:');
console.log('   • Supabase: https://supabase.com');
console.log('   • Vercel: https://vercel.com');
console.log('   • Documentation: ./DEPLOYMENT.md');
console.log('');
console.log('✨ Ready to deploy! Follow DEPLOYMENT.md for detailed instructions.');
