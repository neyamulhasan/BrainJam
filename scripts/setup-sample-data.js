#!/usr/bin/env node

require('dotenv').config();
const { initializeSampleData } = require('./init-sample-data');

async function run() {
    console.log('Starting sample data initialization...');
    // Wait a bit for database connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    await initializeSampleData();
    console.log('Sample data initialization completed!');
    process.exit(0);
}

run().catch(error => {
    console.error('Failed to initialize sample data:', error);
    process.exit(1);
});
