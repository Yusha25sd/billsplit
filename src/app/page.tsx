'use client';

import Footer from '@/components/Layout/Footer';
import Navbar from '@/components/NavbarHomepage';

export default function Home() {
  return (
    <div>
      {/* Layout without Sidebar */}
      <div>
        <Navbar />

        {/* Main Content */}
        <main className="flex-1">
          {/* Creative Blocks */}
          <section className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-8 text-teal-800">
              What Can You Do with BillSplit?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-teal-100 shadow-lg rounded-lg p-6 hover:shadow-xl transition">
                <h3 className="text-xl font-bold mb-2 text-teal-900">Track</h3>
                <p className="text-teal-700">
                  Keep a record of all your group expenses in one place.
                </p>
              </div>
              <div className="bg-teal-100 shadow-lg rounded-lg p-6 hover:shadow-xl transition">
                <h3 className="text-xl font-bold mb-2 text-teal-900">Split</h3>
                <p className="text-teal-700">
                  Divide costs equally or unequally among group members.
                </p>
              </div>
              <div className="bg-teal-100 shadow-lg rounded-lg p-6 hover:shadow-xl transition">
                <h3 className="text-xl font-bold mb-2 text-teal-900">Settle</h3>
                <p className="text-teal-700">
                  Quickly settle balances with friends to avoid confusion.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}