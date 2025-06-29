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
  Database
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Overview', description: 'Dashboard home' },
    { path: '/transactions', icon: TrendingUp, label: 'Transactions', description: 'Sales analytics' },
    { path: '/products', icon: Package, label: 'Products', description: 'Product performance' },
    { path: '/consumers', icon: Users, label: 'Consumers', description: 'Customer insights' },
    { path: '/geography', icon: MapPin, label: 'Geography', description: 'Location analytics' },
    { path: '/ai-assistant', icon: Bot, label: 'AI Assistant', description: 'Retail intelligence' },
    { path: '/reports', icon: FileText, label: 'Reports', description: 'Export & sharing' },
    { path: '/validation', icon: Database, label: 'DB Validation', description: 'Data quality check' },
  ];

  return (
    <motion.aside
      className="w-64 bg-white/30 backdrop-blur-md border-r border-white/20 flex flex-col"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-button block ${isActive ? 'nav-button-active' : 'nav-button-inactive'}`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex items-center space-x-3 group"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Suki Analytics v3.1</p>
          <p className="text-xs text-gray-500">© 2025 TBWA\SMP</p>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;