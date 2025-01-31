import { neon } from "@neondatabase/serverless"; // Import Neon database client

// Define a connection object to track the connection state
type ConnectionObject = {
  isConnected?: boolean;  // Boolean to track connection status
};

const connection: ConnectionObject = {}; // Initialize connection 
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

    await sqlClient`SELECT 1;`;
    connection.isConnected = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error("Database connection failed"); // Replace process.exit(1) with an error
  }
}

export { dbConnect, getSqlClient }; // Export the functions to use them in other parts of the app
