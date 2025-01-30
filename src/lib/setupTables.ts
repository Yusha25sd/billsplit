import { getSqlClient, dbConnect } from './database';

export async function createTables() {
  await dbConnect();
  const sql = getSqlClient();

  try {
    // Create Users table
    await sql`DROP TABLE IF EXISTS users,groups,group_members,expenses,expense_splits,settlements,friend_balances,group_balances;`;
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Groups table
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        group_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL NOT NULL
      );
    `;

    // Create Group Members table
    await sql`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        PRIMARY KEY (group_id, user_id)
      );
    `;

    // Create Expenses table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        expense_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount DECIMAL NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        group_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
      );
    `;

    // Create Expense Splits table
    await sql`
      CREATE TABLE IF NOT EXISTS expense_splits (
        expense_split_id SERIAL PRIMARY KEY,
        expense_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount_paid DECIMAL NOT NULL,
        FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `;

    // Create Settlements table
    await sql`
      CREATE TABLE IF NOT EXISTS settlements (
        settlement_id SERIAL PRIMARY KEY,
        from_user INTEGER NOT NULL,
        to_user INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        amount DECIMAL NOT NULL,
        FOREIGN KEY (from_user) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (to_user) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
      );
    `;

    // Create Friend Balances table
    await sql`
      CREATE TABLE IF NOT EXISTS friend_balances (
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        balance DECIMAL NOT NULL,
        PRIMARY KEY (user_id, friend_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `;

    // Create Group Balances table
    await sql`
      CREATE TABLE IF NOT EXISTS group_balances (
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        balance DECIMAL NOT NULL,
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `;

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createTables();
