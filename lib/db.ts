// Database connection for LeadFinder
import { neon } from '@neondatabase/serverless';

// Database connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create neon client
const sql = neon(connectionString);

// Export the sql client
export default sql;

// Helper function to test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
