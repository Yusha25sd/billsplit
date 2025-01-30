'use client';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-teal-800 text-white h-screen p-4 fixed">
      <ul className="space-y-4">
        <li>
          <a href="/" className="hover:text-teal-400">Home</a>
        </li>
        <li>
          <a href="/features" className="hover:text-teal-400">Features</a>
        </li>
        <li>
          <a href="/about" className="hover:text-teal-400">About Us</a>
        </li>
        <li>
          <a href="/contact" className="hover:text-teal-400">Contact</a>
        </li>
      </ul>
    </aside>
  );
}
