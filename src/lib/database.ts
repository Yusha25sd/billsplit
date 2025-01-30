// src/lib/database.ts
import { neon } from "@neondatabase/serverless"; // Import Neon database client

// Define a connection object to track the connection state
type ConnectionObject = {
  isConnected?: boolean;  // Boolean to track connection status
};

const connection: ConnectionObject = {}; // Initialize connection state object

// This function returns the Neon client if it's connected
let sqlClient: any; // Declare the sqlClient variable to hold the active connection

const getSqlClient = () => {
  if (!sqlClient) {
    throw new Error("Database not connected yet");
  }
  return sqlClient; // Return the existing connection if it's established
};

// Function to establish a connection to the database
async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    return; // Exit if already connected
  }

  try {
    sqlClient = neon(process.env.DATABASE_URL || ''); // Create a new connection if not connected yet

    // Test the connection by executing a simple query (e.g., SELECT 1)
    await sqlClient`SELECT 1;`;

    connection.isConnected = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit the process if connection fails
  }
}

export { dbConnect, getSqlClient }; // Export the functions to use them in other parts of the app
