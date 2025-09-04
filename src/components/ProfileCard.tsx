import React from 'react';
import { Calendar, HardDrive, AlertTriangle, CheckCircle, Siren as Firefox, Settings, Shield, Zap } from 'lucide-react';
import { FirefoxProfile } from '../types/types';

interface ProfileCardProps {
  profile: FirefoxProfile;
  isSelected: boolean;
  onToggleSelection: () => void;
}

export function ProfileCard({ profile, isSelected, onToggleSelection }: ProfileCardProps) {
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getProfileTypeColor = (type: string) => {
    switch (type) {
      case 'default': return 'bg-blue-100 text-blue-800';
      case 'default-release': return 'bg-green-100 text-green-800';
      case 'default-esr': return 'bg-purple-100 text-purple-800';
      case 'developer': return 'bg-orange-100 text-orange-800';
      case 'nightly': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfileTypeIcon = (type: string) => {
    switch (type) {
      case 'developer': return <Settings className="h-3 w-3" />;
      case 'nightly': return <Zap className="h-3 w-3" />;
      default: return <Firefox className="h-3 w-3" />;
    }
  };

  return (
    <div 
      className={`
        relative bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer group hover:shadow-lg
        ${isSelected 
          ? 'border-blue-500 shadow-md bg-blue-50' 
          : profile.validation.isValid 
            ? 'border-gray-200 hover:border-blue-300' 
            : 'border-red-200 bg-red-50'
        }
      `}
      onClick={onToggleSelection}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg">
          <CheckCircle className="h-4 w-4" />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate mb-1">{profile.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getProfileTypeColor(profile.profileType)}`}>
                {getProfileTypeIcon(profile.profileType)}
                <span>{profile.profileType}</span>
              </span>
              {profile.firefoxVersion && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  v{profile.firefoxVersion}
                </span>
              )}
            </div>
          </div>
          
          {/* Status Icon */}
          <div className="ml-3">
            {profile.validation.isValid ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <HardDrive className="h-4 w-4 mr-2" />
            <span>Size: {formatSize(profile.size)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Modified: {formatDate(profile.lastModified)}</span>
          </div>

          <div className="text-xs text-gray-500 truncate">
            Path: {profile.path}
          </div>
        </div>

        {/* Validation Issues */}
        {!profile.validation.isValid && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Profile Issues</span>
            </div>
            <ul className="text-xs text-red-700 space-y-1">
              {profile.validation.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {profile.validation.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Warnings</span>
            </div>
            <ul className="text-xs text-amber-700 space-y-1">
              {profile.validation.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}