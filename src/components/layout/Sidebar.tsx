import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  MapPin,
  Bot,
  FileText,
  Home,
  ChevronRight,
  Database,
  LayoutDashboard,
  Grid,
  Terminal
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Main overview' },
    { path: '/command-center', icon: Terminal, label: 'Command Center', description: 'Query builder' },
    { path: '/products', icon: Package, label: 'Products', description: 'SKU & mix analysis' },
    { path: '/consumers', icon: Users, label: 'Consumers', description: 'Behavior & profiling' },
    { path: '/geography', icon: MapPin, label: 'Geography', description: 'Location insights' },
    { path: '/validation', icon: Database, label: 'Validation', description: 'Data quality' },
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Retail Intelligence v4.0</p>
          <p className="text-xs text-gray-500">© 2025 TBWA\SMP</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;