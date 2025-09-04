import React from 'react';
import { 
  Search, 
  Users, 
  Settings, 
  Play, 
  GitCompare, 
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  profilesCount: number;
  selectedCount: number;
  isProcessing: boolean;
}

export function Sidebar({ activeView, onViewChange, profilesCount, selectedCount, isProcessing }: SidebarProps) {
  const menuItems = [
    {
      id: 'discovery',
      label: 'Profile Discovery',
      icon: Search,
      description: 'Find Firefox profiles',
      enabled: true
    },
    {
      id: 'manager',
      label: 'Profile Manager',
      icon: Users,
      description: `${profilesCount} profiles found`,
      enabled: profilesCount > 0,
      badge: selectedCount > 0 ? selectedCount : undefined
    },
    {
      id: 'configuration',
      label: 'Merge Settings',
      icon: Settings,
      description: 'Configure merge options',
      enabled: selectedCount >= 2
    },
    {
      id: 'comparison',
      label: 'Profile Comparison',
      icon: GitCompare,
      description: 'Compare selected profiles',
      enabled: selectedCount >= 2
    },
    {
      id: 'backup',
      label: 'Backup Manager',
      icon: HardDrive,
      description: 'Manage profile backups',
      enabled: profilesCount > 0
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isEnabled = item.enabled && !isProcessing;
            
            return (
              <button
                key={item.id}
                onClick={() => isEnabled && onViewChange(item.id)}
                disabled={!isEnabled}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : isEnabled
                      ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </div>
                {item.badge && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isProcessing && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="text-sm font-medium text-amber-800">Processing...</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Please wait while the merge operation completes
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Profiles Found:</span>
              <span className="font-medium">{profilesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Selected:</span>
              <span className="font-medium">{selectedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ready to Merge:</span>
              {selectedCount >= 2 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}