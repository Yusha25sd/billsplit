'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const user = session?.user;
  return (
    <div>
    <header className="p-4 md:p-6 shadow-md bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
        <img src="/logo.ico" alt="BillSplit Logo" className="h-8 w-8" />
          <Link href="/dashboard" className="text-xl font-bold" aria-label="Go to homepage">
              BillSplit
          </Link>
        </div>

        {/* Welcome Message */}
        <div className="text-lg">
          <span className="text-xl font-semibold mb-4">Welcome, </span>
          <span className="text-xl font-semibold mb-4">{user?.name}</span>
        </div>

        {/* Logout */}
        <div className="flex items-center space-x-4">
          <Button
            className="w-full md:w-auto bg-slate-100 text-black"
            onClick={() => signOut({callbackUrl:'/'})}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
      {/* Navigation Links */}
      <nav className="bg-teal-600">
      <ul className="text-lg font-semibold container mx-auto px-4 flex justify-center gap-20 py-2">

        <li>
            <Link href="/dashboard" className="hover:text-teal-300 transition-colors">Add Expense
            </Link>
          </li>
          <li>
            <Link href="/dashboard/groups" className="hover:text-teal-300 transition-colors">Groups
            </Link>
          </li>
          <li>
            <Link href="/dashboard/friends" className="hover:text-teal-300 transition-colors">Friends
            </Link>
          </li>
          <li>
            <Link href="/dashboard/activity" className="hover:text-teal-300 transition-colors">Activity
            </Link>
          </li>
          <li>
            <Link href="/dashboard/profileSettings" className="hover:text-teal-300 transition-colors">
                Profile Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
