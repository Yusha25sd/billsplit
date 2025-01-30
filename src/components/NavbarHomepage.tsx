'use client';

import React from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { toast } from './ui/use-toast'; // ShadCN toast utility
import Link from 'next/link';

function Navbar() {
  const handleLogin = async () => {
    try {
      // Force a fresh login by showing account selection
      await signIn("google", {
        callbackUrl: "/dashboard",
        prompt: "select_account",
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Unable to connect with Google. Please try again later.",
        variant: "destructive",
      });
      console.error("Login error:", error);
    }
  };
  

  return (
    <nav className="p-4 md:p-6 shadow-md bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Logo and Brand Name */}
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <img src="/logo.ico" alt="BillSplit Logo" className="h-8 w-8" />
          <Link href="/" className="text-xl font-bold" aria-label="Go to homepage">
              BillSplit
          </Link>
        </div>

        {/* Login Button */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleLogin}
            className="w-full md:w-auto bg-slate-100 text-black"
          >
            Login with Google
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
