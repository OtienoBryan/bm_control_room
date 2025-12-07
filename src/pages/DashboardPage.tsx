import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/Dashboard/StatCard';
import ClientsTable from '../components/Dashboard/ClientsTable';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { dashboardStats } from '../utils/demoData';
import { UsersIcon, FileTextIcon, TrendingUpIcon, DollarSignIcon } from 'lucide-react';
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  return <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-3 border-b border-gray-200">
        
        <p className="mt-1 max-w-4xl text-xs text-gray-500">
          Monitor key metrics and recent activity for Swiss Life insurance.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => navigate('/clients')} className="cursor-pointer">
          <StatCard title="Total Clients" value={dashboardStats.totalClients} icon={<UsersIcon className="h-4 w-4 text-red-600" aria-hidden="true" />} change={{
          value: 5.3,
          positive: true
        }} />
        </div>
        <div onClick={() => navigate('/policies')} className="cursor-pointer">
          <StatCard title="Active Policies" value={dashboardStats.activePolicies} icon={<FileTextIcon className="h-4 w-4 text-red-600" aria-hidden="true" />} change={{
          value: 2.1,
          positive: true
        }} />
        </div>
        <div onClick={() => navigate('/reports')} className="cursor-pointer">
          <StatCard title="Monthly Revenue" value={(dashboardStats.monthlyRevenue / 1000).toFixed(1)} prefix="CHF " suffix="k" icon={<TrendingUpIcon className="h-4 w-4 text-red-600" aria-hidden="true" />} change={{
          value: 1.8,
          positive: true
        }} />
        </div>
        <div onClick={() => navigate('/claims')} className="cursor-pointer">
          <StatCard title="Average Premium" value={dashboardStats.averagePremium.toFixed(2)} prefix="CHF " icon={<DollarSignIcon className="h-4 w-4 text-red-600" aria-hidden="true" />} change={{
          value: 0.5,
          positive: false
        }} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-3 py-3 border-b border-gray-200 sm:px-4">
              <h3 className="text-sm leading-5 font-medium text-gray-900">
                Clients
              </h3>
            </div>
            <div className="p-1.5">
              <ClientsTable />
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white shadow rounded-lg">
            <div className="px-3 py-3 border-b border-gray-200 sm:px-4">
              <h3 className="text-sm leading-5 font-medium text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="px-3 py-3 sm:p-4">
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default DashboardPage;