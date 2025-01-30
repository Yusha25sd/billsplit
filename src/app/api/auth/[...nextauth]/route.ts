import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSqlClient, dbConnect } from '@/lib/database';
declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string; // Add the custom 'id' field
  }

  interface Session extends DefaultSession {
    user: {
      id: string; // Ensure 'id' is included in the session user
      name: string;
      email: string;
    };
  }

  interface JWT {
    userId: string; // Include 'userId' in JWT
  }
}
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Sign in logic, ensuring userId is fetched or created
    async signIn({ user }) {
    
      await dbConnect();
      const { email, name } = user;
      const sql = getSqlClient();
    
      try {
        // Check if user exists in the database
        const existingUser = await sql<{ user_id: string }[]>`
          SELECT user_id FROM users WHERE email = ${email}
        `;
    
        if (existingUser.length === 0) {
          // Insert new user and return the userId
          const newUser = await sql<{ user_id: string }[]>`
            INSERT INTO users (email, username) VALUES (${email}, ${name})
            RETURNING user_id
          `;
          user.id = newUser[0]?.user_id; // Assign the new userId
        } else {
          user.id = existingUser[0].user_id; // Assign existing userId
        }

        return true; // Allow sign-in
      } catch (error) {
        console.error('signIn Callback - Error:', error);
        return false; // Reject sign-in in case of an error
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id; // Attach the userId to the token
        token.email = user.email; // Pass email to the token
        token.name = user.name; // Pass name to the token
      }
      return token;
    },
    // Add userId and only required data to the session
    async session({ session, token }) {
      session.user = {
        id: token.userId as string, // Ensure userId is included in the session
        email: token.email as string,
        name: token.name as string,
      };
      return session;
    }
    
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
