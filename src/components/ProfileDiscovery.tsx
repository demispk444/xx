import { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertCircle, CheckCircle, Chrome, Globe } from 'lucide-react';
import { DiscoveryResult, BrowserType, ExtensionBackupFormat } from '../types/types';
import { MultiSourceReconnaissanceService } from '../utils/profileDiscovery';

interface ProfileDiscoveryProps {
  onDataSourcesDiscovered: (result: DiscoveryResult) => void;
}

export function ProfileDiscovery({ onDataSourcesDiscovered }: ProfileDiscoveryProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const discoveryService = new MultiSourceReconnaissanceService();

  // Check for File System Access API support
  useEffect(() => {
    if (!('showDirectoryPicker' in window)) {
      setError('This application requires Chrome 86+ or Edge 86+ with File System Access API support.');
    }
  }, []);

  const handleScan = async () => {
    setError(null);
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveryResult(null);

    try {
      // Phase 1: Multi-Source Reconnaissance
      setScanProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setScanProgress(40);
      const result = await discoveryService.discoverAllDataSources();
      
      setScanProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setScanProgress(100);
      setDiscoveryResult(result);
      onDataSourcesDiscovered(result);
      setLastScan(new Date());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Multi-source discovery failed');
      console.error('Discovery error:', err);
    }

    setIsScanning(false);
  };

  const getBrowserIcon = (browserType: BrowserType) => {
    switch (browserType) {
      case BrowserType.FIREFOX:
        return <Globe className="h-4 w-4 text-orange-500" />;
      case BrowserType.CHROME:
        return <Chrome className="h-4 w-4 text-blue-500" />;
      case BrowserType.EDGE:
        return <Globe className="h-4 w-4 text-blue-600" />;
      case BrowserType.BRAVE:
        return <Globe className="h-4 w-4 text-orange-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBrowserTypeLabel = (browserType: BrowserType) => {
    switch (browserType) {
      case BrowserType.FIREFOX: return 'Firefox';
      case BrowserType.CHROME: return 'Chrome'; 
      case BrowserType.EDGE: return 'Edge';
      case BrowserType.BRAVE: return 'Brave';
      default: return 'Unknown';
    }
  };

  const getExtensionBackupLabel = (format: ExtensionBackupFormat) => {
    switch (format) {
      case ExtensionBackupFormat.ONETAB_TEXT:
      case ExtensionBackupFormat.ONETAB_JSON:
        return 'OneTab backup';
      case ExtensionBackupFormat.SESSION_BUDDY:
        return 'Session Buddy backup';
      case ExtensionBackupFormat.TABMANAGER_PLUS:
        return 'Tab Manager backup';
      case ExtensionBackupFormat.GENERIC_JSON:
        return 'Generic backup';
      default:
        return 'Unknown backup';
    }
  };

  const generateDiscoveryReport = (result: DiscoveryResult) => {
    const firefoxCount = result.browserProfiles.filter(p => p.browserType === BrowserType.FIREFOX).length;
    const chromeCount = result.browserProfiles.filter(p => p.browserType === BrowserType.CHROME).length;
    const edgeCount = result.browserProfiles.filter(p => p.browserType === BrowserType.EDGE).length;
    const braveCount = result.browserProfiles.filter(p => p.browserType === BrowserType.BRAVE).length;
    
    const parts = [];
    if (firefoxCount) parts.push(`${firefoxCount} Firefox profile${firefoxCount > 1 ? 's' : ''}`);
    if (chromeCount) parts.push(`${chromeCount} Chrome profile${chromeCount > 1 ? 's' : ''}`);
    if (edgeCount) parts.push(`${edgeCount} Edge profile${edgeCount > 1 ? 's' : ''}`);
    if (braveCount) parts.push(`${braveCount} Brave profile${braveCount > 1 ? 's' : ''}`);
    if (result.extensionBackups.length) parts.push(`${result.extensionBackups.length} extension backup file${result.extensionBackups.length > 1 ? 's' : ''}`);
    
    const summary = parts.length ? parts.join(', ') + '. Ready to assimilate.' : 'No data sources found.';
    return summary;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Source Reconnaissance</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Scan chaotic browser data and identify all valuable sources for synthesis. We'll discover 
            Firefox & Chrome profiles, extension backups, and prepare them for assimilation.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Scan Progress */}
          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  🔍 {scanProgress < 30 ? 'Accessing directory structure...' : 
                      scanProgress < 70 ? 'Scanning for browser profiles and extensions...' : 
                      'Cataloguing discovered sources...'}
                </span>
                <span className="font-medium text-purple-600">{scanProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Discovery Results */}
          {discoveryResult && !isScanning && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-800">Scan Complete</span>
                </div>
                <p className="text-green-800 text-lg font-medium mb-4">
                  {generateDiscoveryReport(discoveryResult)}
                </p>
                
                {/* Detailed Results */}
                <div className="space-y-4">
                  {/* Browser Profiles */}
                  {discoveryResult.browserProfiles.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Browser Profiles ({discoveryResult.browserProfiles.length})
                      </h4>
                      <div className="grid gap-2">
                        {discoveryResult.browserProfiles.map((profile) => (
                          <div key={profile.id} className="bg-white border rounded-lg p-3 flex items-center space-x-3">
                            {getBrowserIcon(profile.browserType)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {getBrowserTypeLabel(profile.browserType)} - {profile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(profile.size / (1024 * 1024)).toFixed(1)} MB • Confidence: {Math.round((profile.validation as any).confidence * 100)}%
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              profile.validation.isValid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {profile.validation.isValid ? 'Valid' : 'Issues'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extension Backups */}
                  {discoveryResult.extensionBackups.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Extension Backups ({discoveryResult.extensionBackups.length})
                      </h4>
                      <div className="grid gap-2">
                        {discoveryResult.extensionBackups.map((backup) => (
                          <div key={backup.id} className="bg-white border rounded-lg p-3 flex items-center space-x-3">
                            <Database className="h-4 w-4 text-blue-500" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {getExtensionBackupLabel(backup.format)} - {backup.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {backup.tabCount ? `${backup.tabCount} tabs • ` : ''}{(backup.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              backup.validation.isValid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {backup.validation.isValid ? 'Valid' : 'Issues'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
          {lastScan && !isScanning && !error && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Scanned: {lastScan.toLocaleString()}</span>
              {discoveryResult && (
                <span className="ml-2 text-gray-400">•</span>
              )}
              {discoveryResult && (
                <span>Path: {discoveryResult.scanPath}</span>
              )}
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
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }
            `}
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Scanning Directory...</span>
              </>
            ) : (
              <>
                <Database className="h-5 w-5" />
                <span>Start Multi-Source Reconnaissance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Phase Information */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-start space-x-3">
          <Database className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900 mb-2">Phase 1: Multi-Source Reconnaissance</h3>
            <p className="text-sm text-purple-800 mb-3">
              This operation will scan your selected directory and identify all valuable data sources within it:
            </p>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>🔥 <strong>Complete Firefox Profiles</strong> - Identified by places.sqlite and prefs.js</li>
              <li>🌐 <strong>Chrome/Chromium Profiles</strong> - Chrome, Edge, Brave with Bookmarks and Login Data</li>
              <li>📁 <strong>Extension Backups</strong> - OneTab, Session Buddy, and other tab managers</li>
              <li>🔍 <strong>Recursive Scanning</strong> - Deep directory analysis for all data sources</li>
              <li>✅ <strong>Intelligent Validation</strong> - Confidence scoring and integrity checking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-900 mb-2">System Requirements</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Chrome 86+ or Edge 86+ with File System Access API support</li>
              <li>• Close all browser windows before synthesis</li>
              <li>• Grant directory access permissions when prompted</li>
              <li>• Point to a directory containing browser data or backups</li>
              <li>• Ensure sufficient disk space for the synthesis operation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}