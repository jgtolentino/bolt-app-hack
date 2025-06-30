import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { sidebarConfig, SidebarItem } from '../../config/sidebarConfig';
import GlobalHeader from './GlobalHeader';
import RightSidebar from './RightSidebar';
import { Icon } from '@iconify/react';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['analytics', 'operations']);
  const location = useLocation();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isParentActive = (item: SidebarItem) => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return false;
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isParentActive(item);

    const itemContent = (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100",
          active && "bg-blue-50 text-blue-700 hover:bg-blue-100",
          depth > 0 && "ml-6"
        )}
      >
        <Icon icon={item.icon} className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">{item.label}</span>
        {hasChildren && (
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
    );

    return (
      <li key={item.id}>
        {item.path && !hasChildren ? (
          <Link to={item.path} onClick={() => setIsSidebarOpen(false)}>
            {itemContent}
          </Link>
        ) : (
          <button
            onClick={() => hasChildren && toggleExpanded(item.id)}
            className="w-full text-left"
          >
            {itemContent}
          </button>
        )}
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 px-6">
            <h2 className="text-xl font-bold text-gray-900">Retail Intel</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {sidebarConfig.map(item => renderSidebarItem(item))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500">
              <div>Version 2.0.0</div>
              <div>© 2024 Retail Intelligence</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <GlobalHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>

          {/* Right Sidebar - Filters */}
          <RightSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}