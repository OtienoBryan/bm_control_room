import React, { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XIcon, 
  HomeIcon, 
  UsersIcon, 
  CogIcon, 
  ShieldIcon, 
  BoxIcon, 
  ImageIcon, 
  InfoIcon, 
  GroupIcon, 
  Tally4Icon, 
  BellIcon,
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  FileTextIcon,
  CalendarIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DangerousRounded } from '@mui/icons-material';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Custom icons for better visual representation
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const RouteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// Organized navigation with categories
const navigation: NavigationSection[] = [
  {
    category: 'Main',
    items: [
      {
        name: 'Dashboard',
        href: '/',
        icon: HomeIcon,
        description: 'Overview and statistics'
      }
    ]
  },
  {
    category: 'Operations',
    items: [
      {
        name: 'Unscheduled',
        href: '/dashboard/unscheduled',
        icon: CalendarIcon,
        description: 'Pending requests'
      },
      {
        name: 'Pending',
        href: '/dashboard/pending',
        icon: ClockIcon,
        description: 'Requests in queue'
      },
      {
        name: 'In Transit',
        href: '/dashboard/in-transit',
        icon: TruckIcon,
        description: 'Active deliveries'
      },
      {
        name: 'Runs',
        href: '/dashboard/runs',
        icon: RouteIcon,
        description: 'Completed runs'
      }
    ]
  },
  {
    category: 'Management',
    items: [
      {
        name: 'Staff List',
        href: '/dashboard/staff-list',
        icon: UsersIcon,
        description: 'Manage personnel'
      },
      {
        name: 'Teams List',
        href: '/dashboard/teams-list',
        icon: GroupIcon,
        description: 'Team management'
      },
      {
        name: 'Vehicle Management',
        href: '/dashboard/vehicle-management',
        icon: CarIcon,
        description: 'Fleet management'
      },
      {
        name: 'Client List',
        href: '/dashboard/clients-list',
        icon: BuildingIcon,
        description: 'Client database'
      }
    ]
  },
  {
    category: 'Monitoring',
    items: [
      {
        name: 'SOS Alerts',
        href: '/dashboard/sos-list',
        icon: AlertTriangleIcon,
        description: 'Emergency notifications',
        badge: 'Live'
      },
      {
        name: 'Daily Reports',
        href: '/dashboard/daily',
        icon: BarChart3Icon,
        description: 'Performance metrics'
      },
      {
        name: 'Notice Board',
        href: '/dashboard/notices',
        icon: BellIcon,
        description: 'Announcements'
      }
    ]
  },
  {
    category: 'System',
    items: [
      {
        name: 'Settings',
        href: '/settings',
        icon: SettingsIcon,
        description: 'System configuration'
      }
    ]
  }
];

// Navigation item interface
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

// Navigation section interface
interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const logoSection = (
    <div className="flex items-center h-16 flex-shrink-0 px-6 bg-gradient-to-r from-blue-950 to-red-700">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <ShieldIcon className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">BM Security</h1>
          <p className="text-xs text-red-100">Logistics Management</p>
        </div>
      </div>
    </div>
  );

  const userProfileSection = (
    <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.username}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {user?.role}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200"
            title="Logout"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNavigation = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navigation.map((section) => (
        <div key={section.category} className="space-y-1">
          {/* Section Header */}
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.category}
            </h3>
          </div>
          
          {/* Section Items */}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active 
                      ? 'bg-red-50 text-red-700 border-r-2 border-red-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                  }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                      active ? 'text-red-600' : 'text-gray-400 group-hover:text-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
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
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
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
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
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
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              
              {logoSection}
              <div className="flex-1 overflow-y-auto">
                {renderNavigation()}
              </div>
              {userProfileSection}
            </div>
          </Transition.Child>
          
          <div className="flex-shrink-0 w-14" aria-hidden="true" />
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-0 flex-1">
            {logoSection}
            <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
              {renderNavigation()}
            </div>
            {userProfileSection}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;