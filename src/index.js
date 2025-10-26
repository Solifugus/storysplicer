/**
 * StorySplicer - Main entry point
 */

import { testConnection } from './db/index.js';

async function main() {
  console.log('StorySplicer - World Simulation System');
  console.log('======================================\n');

  // Test database connection
  const connected = await testConnection();

  if (!connected) {
    console.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }

  console.log('\nStorySplicer is ready!');
  console.log('\nNext steps:');
  console.log('  1. Run migrations: npm run migrate');
  console.log('  2. Run tests: npm test');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
