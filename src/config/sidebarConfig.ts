export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: SidebarItem[];
}

export const sidebarConfig: SidebarItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'mdi:home',
    path: '/'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'mdi:chart-box',
    children: [
      {
        id: 'overview',
        label: 'Overview',
        icon: 'mdi:view-dashboard',
        path: '/analytics/overview'
      },
      {
        id: 'performance',
        label: 'Performance',
        icon: 'mdi:speedometer',
        path: '/analytics/performance'
      },
      {
        id: 'sentiment',
        label: 'Sentiment',
        icon: 'mdi:emoticon-happy',
        path: '/analytics/sentiment'
      }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'mdi:cog',
    children: [
      {
        id: 'logistics',
        label: 'Logistics',
        icon: 'mdi:truck',
        path: '/operations/logistics'
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: 'mdi:package-variant',
        path: '/operations/inventory'
      },
      {
        id: 'team',
        label: 'Team',
        icon: 'mdi:account-group',
        path: '/operations/team'
      }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: 'mdi:brain',
    children: [
      {
        id: 'market',
        label: 'Market',
        icon: 'mdi:trending-up',
        path: '/intelligence/market'
      },
      {
        id: 'competitor',
        label: 'Competitor',
        icon: 'mdi:sword-cross',
        path: '/intelligence/competitor'
      },
      {
        id: 'predictive',
        label: 'Predictive',
        icon: 'mdi:crystal-ball',
        path: '/intelligence/predictive'
      }
    ]
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: 'mdi:map',
    children: [
      {
        id: 'coverage',
        label: 'Coverage',
        icon: 'mdi:map-marker-radius',
        path: '/maps/coverage'
      },
      {
        id: 'regions',
        label: 'Regions',
        icon: 'mdi:map-search',
        path: '/maps/regions'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'mdi:cog',
    path: '/settings'
  }
];