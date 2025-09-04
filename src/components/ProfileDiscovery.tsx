import React, { useState, useEffect } from 'react';
import { Search, Folder, HardDrive, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { FirefoxProfile } from '../types/types';
import { ProfileDiscoveryService } from '../utils/profileDiscovery';

interface ProfileDiscoveryProps {
  onProfilesDiscovered: (profiles: FirefoxProfile[]) => void;
}

export function ProfileDiscovery({ onProfilesDiscovered }: ProfileDiscoveryProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanPath, setScanPath] = useState('');
  const [recursive, setRecursive] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const discoveryService = new ProfileDiscoveryService();

  // Check for File System Access API support
  useEffect(() => {
    if (!('showDirectoryPicker' in window)) {
      setError('This application requires a modern browser with File System Access API support. Please use Chrome 86+ or Edge 86+.');
    }
  }, []);

  const handleScan = async () => {
    setError(null);
    setIsScanning(true);
    setScanProgress(0);

    try {
      // Update progress during discovery
      setScanProgress(25);
      
      // Discover profiles using the real service
      const discoveredProfiles = await discoveryService.discoverProfiles(scanPath || undefined);
      
      setScanProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setScanProgress(100);
      onProfilesDiscovered(discoveredProfiles);
      setLastScan(new Date());
      
      if (discoveredProfiles.length === 0) {
        setError('No Firefox profiles found. Please check the search location and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile discovery failed');
      console.error('Profile discovery error:', err);
    }

    setIsScanning(false);
  };

  const handleFolderSelect = () => {
    // In a real app, this would open a folder picker
    setScanPath('/Users/username/Library/Application Support/Firefox/Profiles');
  };

  const getDefaultPaths = () => {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) {
      return [
        '~/Library/Application Support/Firefox/Profiles',
        '~/Library/Application Support/Firefox'
      ];
    } else if (platform.includes('win')) {
      return [
        '%APPDATA%\\Mozilla\\Firefox\\Profiles',
        '%APPDATA%\\Mozilla\\Firefox'
      ];
    } else {
      return [
        '~/.mozilla/firefox',
        '~/.firefox'
      ];
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Firefox Profiles</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Automatically scan your system for Firefox profiles. We'll search common locations and 
            validate each profile to ensure it's ready for merging.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Scan Path Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Location
            </label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={scanPath}
                  onChange={(e) => setScanPath(e.target.value)}
                  placeholder="Leave empty for automatic detection"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleFolderSelect}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Folder className="h-4 w-4" />
                <span>Browse</span>
              </button>
            </div>
          </div>

          {/* Default Locations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <HardDrive className="h-4 w-4 mr-2" />
              Default Search Locations
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              {getDefaultPaths().map((path, index) => (
                <div key={index} className="font-mono bg-white px-2 py-1 rounded border">
                  {path}
                </div>
              ))}
            </div>
          </div>

          {/* Scan Options */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="recursive"
                checked={recursive}
                onChange={(e) => setRecursive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recursive" className="text-sm font-medium text-gray-700">
                Recursive Search
              </label>
            </div>
            <p className="text-xs text-gray-600">
              Search subdirectories for profiles
            </p>
          </div>

          {/* Scan Progress */}
          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {scanProgress < 50 ? 'Accessing file system...' : 'Scanning for profiles...'}
                </span>
                <span className="font-medium text-blue-600">{scanProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Discovery Failed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Last Scan Info */}
          {lastScan && !isScanning && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Last scan: {lastScan.toLocaleString()}</span>
            </div>
          )}

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={isScanning}
            className={`
              w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2
              ${isScanning
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }
            `}
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Scanning Profiles...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Start Profile Discovery</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Important Requirements</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This application requires a modern browser with File System Access API support (Chrome, Edge)</li>
              <li>• Close all Firefox windows before merging profiles</li>
              <li>• Ensure you have sufficient disk space for backups</li>
              <li>• Consider running a dry-run first to preview changes</li>
              <li>• You'll need to grant permission to access your Firefox profile directories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}