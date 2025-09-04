import React, { useState } from 'react';
import { 
  Settings, 
  ArrowLeft, 
  ArrowRight, 
  Shield, 
  Zap, 
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { MergeConfig, ConflictResolution, MergeDataType, CompressionType } from '../types/types';

interface MergeConfigurationProps {
  config: MergeConfig;
  onConfigChange: (config: MergeConfig) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function MergeConfiguration({ config, onConfigChange, onBack, onContinue }: MergeConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'conflicts' | 'backup' | 'advanced'>('data');

  const updateConfig = (updates: Partial<MergeConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleMergeType = (type: MergeDataType) => {
    const isAll = type === MergeDataType.ALL;
    const hasAll = config.mergeTypes.includes(MergeDataType.ALL);
    
    if (isAll) {
      if (hasAll) {
        updateConfig({ mergeTypes: [] });
      } else {
        updateConfig({ mergeTypes: [MergeDataType.ALL] });
      }
    } else {
      let newTypes = config.mergeTypes.filter(t => t !== MergeDataType.ALL);
      
      if (newTypes.includes(type)) {
        newTypes = newTypes.filter(t => t !== type);
      } else {
        newTypes.push(type);
      }
      
      updateConfig({ mergeTypes: newTypes });
    }
  };

  const dataTypes = [
    { type: MergeDataType.BOOKMARKS, label: 'Bookmarks', description: 'Browser bookmarks and folders', icon: '🔖' },
    { type: MergeDataType.HISTORY, label: 'History', description: 'Browsing history and visits', icon: '📚' },
    { type: MergeDataType.PASSWORDS, label: 'Passwords', description: 'Saved login credentials', icon: '🔐' },
    { type: MergeDataType.COOKIES, label: 'Cookies', description: 'Website cookies and sessions', icon: '🍪' },
    { type: MergeDataType.EXTENSIONS, label: 'Extensions', description: 'Add-ons and extensions', icon: '🧩' },
    { type: MergeDataType.PREFERENCES, label: 'Preferences', description: 'User settings and preferences', icon: '⚙️' },
    { type: MergeDataType.FORM_HISTORY, label: 'Form History', description: 'Saved form data', icon: '📝' },
    { type: MergeDataType.PERMISSIONS, label: 'Permissions', description: 'Site permissions', icon: '🛡️' },
    { type: MergeDataType.SESSIONS, label: 'Sessions', description: 'Tab sessions and windows', icon: '🪟' }
  ];

  const conflictStrategies = [
    { 
      value: ConflictResolution.KEEP_NEWEST, 
      label: 'Keep Newest', 
      description: 'Prioritize the most recently modified data',
      icon: <Zap className="h-4 w-4 text-blue-600" />
    },
    { 
      value: ConflictResolution.KEEP_OLDEST, 
      label: 'Keep Oldest', 
      description: 'Prioritize the oldest data entries',
      icon: <Shield className="h-4 w-4 text-green-600" />
    },
    { 
      value: ConflictResolution.KEEP_ALL, 
      label: 'Keep All', 
      description: 'Attempt to preserve all data where possible',
      icon: <HardDrive className="h-4 w-4 text-purple-600" />
    }
  ];

  const compressionOptions = [
    { value: CompressionType.ZIP, label: 'ZIP', description: 'Fast compression, widely supported' },
    { value: CompressionType.GZIP, label: 'GZIP', description: 'Good compression ratio' },
    { value: CompressionType.BZIP2, label: 'BZIP2', description: 'Best compression, slower' },
    { value: CompressionType.NONE, label: 'None', description: 'No compression, fastest' }
  ];

  const tabs = [
    { id: 'data', label: 'Data Types', icon: CheckCircle },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
    { id: 'backup', label: 'Backup', icon: HardDrive },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Merge Configuration</h2>
            <p className="text-gray-600">Customize how your Firefox profiles will be merged</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 border-b-2 transition-colors
                    ${isActive 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Data Types to Merge</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.mergeTypes.includes(MergeDataType.ALL)}
                      onChange={() => toggleMergeType(MergeDataType.ALL)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataTypes.map(({ type, label, description, icon }) => {
                  const isSelected = config.mergeTypes.includes(type) || config.mergeTypes.includes(MergeDataType.ALL);
                  
                  return (
                    <div
                      key={type}
                      onClick={() => toggleMergeType(type)}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">{icon}</span>
                        <h4 className="font-medium text-gray-900">{label}</h4>
                        {isSelected && <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />}
                      </div>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conflict Resolution Strategy</h3>
              <p className="text-gray-600 mb-6">
                Choose how to handle conflicts when the same data exists in multiple profiles.
              </p>

              <div className="space-y-4">
                {conflictStrategies.map((strategy) => (
                  <div
                    key={strategy.value}
                    onClick={() => updateConfig({ conflictResolution: strategy.value })}
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                      ${config.conflictResolution === strategy.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {strategy.icon}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{strategy.label}</h4>
                        <p className="text-sm text-gray-600">{strategy.description}</p>
                      </div>
                      {config.conflictResolution === strategy.value && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Backup Configuration</h3>
              
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableBackup"
                    checked={config.backup}
                    onChange={(e) => updateConfig({ backup: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="enableBackup" className="font-medium text-green-900">
                      Create Backup Before Merging
                    </label>
                    <p className="text-sm text-green-700">
                      Highly recommended to prevent data loss
                    </p>
                  </div>
                </div>
                <Shield className="h-6 w-6 text-green-600" />
              </div>

              {config.backup && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Compression Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {compressionOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => updateConfig({ compression: option.value })}
                          className={`
                            p-3 border-2 rounded-lg cursor-pointer transition-all duration-200
                            ${config.compression === option.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{option.label}</h4>
                              <p className="text-xs text-gray-600">{option.description}</p>
                            </div>
                            {config.compression === option.value && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="dryRun"
                      checked={config.dryRun}
                      onChange={(e) => updateConfig({ dryRun: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="dryRun" className="font-medium text-gray-900">
                        Dry Run Mode
                      </label>
                      <p className="text-sm text-gray-600">
                        Preview changes without making modifications
                      </p>
                    </div>
                  </div>
                  <Info className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="profileCleanup"
                      checked={config.profileCleanup}
                      onChange={(e) => updateConfig({ profileCleanup: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="profileCleanup" className="font-medium text-gray-900">
                        Profile Cleanup
                      </label>
                      <p className="text-sm text-gray-600">
                        Clean temporary files and optimize databases
                      </p>
                    </div>
                  </div>
                  <HardDrive className="h-5 w-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="sessionRecovery"
                      checked={config.sessionRecovery}
                      onChange={(e) => updateConfig({ sessionRecovery: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="sessionRecovery" className="font-medium text-gray-900">
                        Session Recovery
                      </label>
                      <p className="text-sm text-gray-600">
                        Merge and preserve tab sessions
                      </p>
                    </div>
                  </div>
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Important Notes</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Profile cleanup can improve performance but may remove some cached data</li>
                      <li>• Session recovery requires Firefox to be closed before merging</li>
                      <li>• Always test the merged profile before deleting originals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}