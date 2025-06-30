import React, { useState } from 'react';
import Sidebar from '../template_sync/partials/Sidebar';
import Header from '../template_sync/partials/Header';
import { KpiCardsAdapter } from '../features/dashboard/adapters/KpiCardAdapter';
import { SalesChartAdapter } from '../features/dashboard/adapters/SalesChartAdapter';
import { TransactionVolumeAdapter } from '../features/dashboard/adapters/TransactionVolumeAdapter';

function CruipDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('last7Days');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Dashboard header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Scout Analytics Dashboard ✨
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time insights powered by Cruip design
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              <KpiCardsAdapter dateRange={dateRange} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-12 gap-6">
              {/* Sales Trend */}
              <div className="col-span-12 xl:col-span-8">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                  <header className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Sales Trend
                    </h2>
                  </header>
                  <SalesChartAdapter dateRange={dateRange} height={350} />
                </div>
              </div>

              {/* Transaction Volume */}
              <div className="col-span-12 xl:col-span-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                  <header className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Hourly Transactions
                    </h2>
                  </header>
                  <TransactionVolumeAdapter dateRange={dateRange} height={350} width={389} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CruipDashboard;