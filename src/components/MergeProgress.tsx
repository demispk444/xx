import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { FirefoxProfile, MergeConfig } from '../types/types';
import { MergeEngine } from '../utils/mergeEngine';

interface MergeProgressProps {
  profiles: FirefoxProfile[];
  config: MergeConfig;
  onComplete: (mergedData: any) => void;
}

export function MergeProgress({ profiles, config, onComplete }: MergeProgressProps) {
  const [status, setStatus] = useState<'running' | 'completed' | 'error'>('running');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const runMergePreview = async () => {
      const mergeEngine = new MergeEngine();
      try {
        const result = await mergeEngine.generateMergePreview(profiles, config);
        if (result.success) {
          setStats(result.stats);
          setStatus('completed');
          // Pass the merged data back to the App component
          onComplete(result.mergedData);
        } else {
          throw new Error(result.error || 'The merge preview failed for an unknown reason.');
        }
      } catch (err: any) {
        setError(err.message);
        setStatus('error');
      }
    };

    runMergePreview();
  }, [profiles, config, onComplete]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {status === 'completed' && <CheckCircle className="h-8 w-8 text-green-600" />}
            {status === 'running' && <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            {status === 'error' && <AlertTriangle className="h-8 w-8 text-red-600" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'running' && 'Generating Merge Preview...'}
            {status === 'completed' && 'Preview Generated Successfully!'}
            {status === 'error' && 'Merge Preview Failed'}
          </h2>
          <p className="text-gray-600">
            {status === 'running' && 'Please wait while we process and deduplicate your data...'}
            {status === 'completed' && 'Redirecting to the data viewer...'}
            {status === 'error' && error}
          </p>
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Statistics</h3>
           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Bookmarks</h4>
                <p className="text-sm text-blue-700">
                  Processed {stats.bookmarks.total.toLocaleString()} items, found {stats.bookmarks.added.toLocaleString()} unique entries.
                </p>
              </div>
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
