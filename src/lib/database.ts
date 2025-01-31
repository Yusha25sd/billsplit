import { neon, NeonQueryFunction } from "@neondatabase/serverless"; // Import types

// Define a connection object to track the connection state
type ConnectionObject = {
  isConnected?: boolean; // Boolean to track connection status
};

const connection: ConnectionObject = {}; // Initialize connection state object

// Explicitly type sqlClient using correct generic arguments
let sqlClient: NeonQueryFunction<true, false> | null = null; 

const getSqlClient = (): NeonQueryFunction<true, false> => {
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
    sqlClient = neon<true, false>(process.env.DATABASE_URL || ""); // Establish connection

    // Test the connection by executing a simple query (e.g., SELECT 1)
    await sqlClient`SELECT 1;`;

    connection.isConnected = true;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw new Error("Database connection failed");
  }
}

export { dbConnect, getSqlClient };
