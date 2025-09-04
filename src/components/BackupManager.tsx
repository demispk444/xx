import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  HardDrive, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  Calendar,
  FileArchive,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { FirefoxProfile, CompressionType } from '../types/types';
import { BackupManager as BackupService } from '../utils/backupManager';

interface BackupManagerProps {
  profiles: FirefoxProfile[];
  onBack: () => void;
}

interface BackupEntry {
  id: string;
  name: string;
  date: Date;
  size: number;
  compression: CompressionType;
  profilesCount: number;
  status: 'valid' | 'corrupted' | 'missing';
  path: string;
}

export function BackupManager({ profiles, onBack }: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedCompression, setSelectedCompression] = useState(CompressionType.ZIP);
  const [backupProgress, setBackupProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const backupService = new BackupService();

  // Load existing backups on component mount
  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const existingBackups = await backupService.listBackups();
      setBackups(existingBackups);
    } catch (err) {
      console.error('Failed to load backups:', err);
      setError('Failed to load existing backups');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const createBackup = async () => {
    setError(null);
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Update progress during backup creation
      setBackupProgress(25);
      
      const result = await backupService.createBackup(profiles, selectedCompression);
      
      setBackupProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBackupProgress(100);
      
      if (result.success) {
        // Add new backup to list
        const newBackup: BackupEntry = {
          id: Date.now().toString(),
          name: `Manual Backup - ${new Date().toLocaleDateString()}`,
          date: new Date(),
          size: profiles.reduce((sum, p) => sum + p.size, 0),
          compression: selectedCompression,
          profilesCount: profiles.length,
          status: 'valid',
          path: result.backupPath || 'Unknown'
        };

        setBackups([newBackup, ...backups]);
      } else {
        setError(result.error || 'Backup creation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup creation failed');
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const deleteBackup = (id: string) => {
    setBackups(backups.filter(b => b.id !== id));
  };

  const verifyBackup = (backup: BackupEntry) => {
    // Real verification
    backupService.verifyBackup(backup.path).then(result => {
      setBackups(prevBackups => 
        prevBackups.map(b => 
          b.id === backup.id 
            ? { ...b, status: result.isValid ? 'valid' as const : 'corrupted' as const }
            : b
        )
      );
    }).catch(err => {
      console.error('Backup verification failed:', err);
      setBackups(prevBackups => 
        prevBackups.map(b => 
          b.id === backup.id 
            ? { ...b, status: 'corrupted' as const }
            : b
        )
      );
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'corrupted':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'missing':
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default:
        return <FileArchive className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCompressionIcon = (compression: CompressionType) => {
    return <FileArchive className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Backup Manager</h2>
            <p className="text-gray-600">Create, verify, and manage profile backups</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Create New Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Backup</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profiles to Backup
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900 font-medium">{profiles.length} selected profiles</p>
                <p className="text-xs text-gray-600">
                  Total size: {formatSize(profiles.reduce((sum, p) => sum + p.size, 0))}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compression Type
              </label>
              <select
                value={selectedCompression}
                onChange={(e) => setSelectedCompression(e.target.value as CompressionType)}
                disabled={isCreatingBackup}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={CompressionType.ZIP}>ZIP (Fast, Compatible)</option>
                <option value={CompressionType.GZIP}>GZIP (Good Compression)</option>
                <option value={CompressionType.BZIP2}>BZIP2 (Best Compression)</option>
                <option value={CompressionType.NONE}>None (Fastest)</option>
              </select>
            </div>
          </div>

          {isCreatingBackup && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Creating backup...</span>
                <span className="font-medium text-blue-600">{backupProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${backupProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Backup Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          <button
            onClick={createBackup}
            disabled={isCreatingBackup}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2
              ${isCreatingBackup
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Creating Backup...</span>
              </>
            ) : (
              <>
                <HardDrive className="h-4 w-4" />
                <span>Create Backup</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Existing Backups */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Existing Backups</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadBackups}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Refresh backup list"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-sm text-gray-600">{backups.length} backup{backups.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Loading Backups...</h4>
            <p className="text-gray-600">Scanning for existing backup files...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <HardDrive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Backups Found</h4>
            <p className="text-gray-600">Create your first backup to protect your profile data, or check if you have backups in other locations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(backup.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{backup.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(backup.date)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          {getCompressionIcon(backup.compression)}
                          <span>{formatSize(backup.size)}</span>
                        </span>
                        <span>{backup.profilesCount} profile{backup.profilesCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => verifyBackup(backup)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Verify Backup"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Download Backup"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Restore Backup"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete Backup"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}