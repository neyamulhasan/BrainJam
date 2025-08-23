#!/usr/bin/env node

require('dotenv').config();
const { createTestUsers } = require('./create-test-users');

async function run() {
    console.log('Creating test users for leaderboard...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await createTestUsers();
    console.log('Test users creation completed!');
    process.exit(0);
}

run().catch(error => {
    console.error('Failed to create test users:', error);
    process.exit(1);
});
