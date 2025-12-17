import React, { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XIcon, 
  HomeIcon, 
  UsersIcon, 
  CogIcon, 
  ShieldIcon, 
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  RouteIcon,
  GroupIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  BellIcon,
  LogOutIcon,
  SettingsIcon,
  CarIcon,
  FileTextIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

const navigation: NavigationSection[] = [
  {
    category: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon }
    ]
  },
  {
    category: 'Operations',
    items: [
      { name: 'Unscheduled', href: '/dashboard/unscheduled', icon: CalendarIcon },
      { name: 'Pending', href: '/dashboard/pending', icon: ClockIcon },
      { name: 'In Transit', href: '/dashboard/in-transit', icon: TruckIcon },
      { name: 'Runs', href: '/dashboard/runs', icon: RouteIcon }
    ]
  },
  {
    category: 'Management',
    items: [
      { name: 'Staff', href: '/dashboard/staff-list', icon: UsersIcon },
      { name: 'Teams', href: '/dashboard/teams-list', icon: GroupIcon },
      { name: 'Vehicles', href: '/dashboard/vehicle-management', icon: CarIcon }
    ]
  },
  {
    category: 'Reports',
    items: [
      { name: 'SOS Alerts', href: '/dashboard/sos-list', icon: AlertTriangleIcon, badge: 'Live' },
      { name: 'Runs Reports', href: '/dashboard/done-requests', icon: BarChart3Icon },
      { name: 'Notices', href: '/dashboard/notices', icon: BellIcon },
      { name: 'Audit Trail', href: '/dashboard/audit-logs', icon: FileTextIcon }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const logoSection = (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-blue-700">
      <div className="flex-shrink-0">
        <img 
          src="/bm.jpeg" 
          alt="BM Security Logo" 
          className="h-8 w-8 object-contain rounded"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg hidden logo-fallback">
          <ShieldIcon className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xs font-bold text-white truncate">BM Security</h1>
        <p className="text-[9px] text-blue-200 truncate">Logistics</p>
      </div>
    </div>
  );

  const userProfileSection = (
    <div className="border-t border-blue-700 p-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-semibold text-white">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-white truncate">
            {user?.username}
          </p>
          <p className="text-[9px] text-blue-200 capitalize truncate">
            {user?.role}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-1 text-blue-300 hover:text-white hover:bg-blue-700 rounded-lg transition-all duration-200"
          title="Logout"
        >
          <LogOutIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  const renderNavigation = () => (
    <nav className="flex-1 px-2 py-2 space-y-2 overflow-y-auto">
      {navigation.map((section) => (
        <div key={section.category}>
          <h3 className="px-2 mb-0.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wide">
            {section.category}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center justify-between px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                    active 
                      ? 'bg-blue-700 text-white shadow-sm' 
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`flex-shrink-0 h-3.5 w-3.5 transition-colors duration-200 ${
                        active ? 'text-white' : 'text-blue-300 group-hover:text-white'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Settings at bottom */}
      <div className="pt-1.5 border-t border-blue-700">
        <Link
          to="/settings"
          className={`group flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
            isActive('/settings')
              ? 'bg-blue-700 text-white shadow-sm'
              : 'text-blue-100 hover:bg-blue-700 hover:text-white'
          }`}
        >
          <SettingsIcon
            className={`flex-shrink-0 h-3.5 w-3.5 transition-colors duration-200 ${
              isActive('/settings') ? 'text-white' : 'text-blue-300 group-hover:text-white'
            }`}
          />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-950">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <XIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </Transition.Child>
              
              {logoSection}
              {renderNavigation()}
              {userProfileSection}
            </div>
          </Transition.Child>
          
          <div className="flex-shrink-0 w-14" />
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-blue-900 border-r border-gray-100">
          {logoSection}
          {renderNavigation()}
          {userProfileSection}
        </div>
      </div>
    </>
  );
};

export default Sidebar;