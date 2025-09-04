import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  HardDrive, 
  Database, 
  Shield,
  Download,
  FileText,
  Clock,
  Zap
} from 'lucide-react';
import { FirefoxProfile, MergeConfig, MergeStats } from '../types/types';
import { MergeEngine } from '../utils/mergeEngine';

interface MergeProgressProps {
  profiles: FirefoxProfile[];
  config: MergeConfig;
  onComplete: () => void;
}

interface MergeStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  stats?: any;
}

export function MergeProgress({ profiles, config, onComplete }: MergeProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [mergeStats, setMergeStats] = useState<MergeStats>({});
  const [startTime] = useState(new Date());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mergeEngine = new MergeEngine();

  const [steps, setSteps] = useState<MergeStep[]>([
    {
      id: 'backup',
      label: 'Creating Backup',
      description: 'Backing up original profiles for safety',
      icon: Shield,
      status: 'pending',
      progress: 0
    },
    {
      id: 'validation',
      label: 'Validating Profiles',
      description: 'Checking profile integrity and compatibility',
      icon: CheckCircle,
      status: 'pending',
      progress: 0
    },
    {
      id: 'cleanup',
      label: 'Profile Cleanup',
      description: 'Optimizing databases and removing temporary files',
      icon: HardDrive,
      status: 'pending',
      progress: 0
    },
    {
      id: 'merge',
      label: 'Merging Data',
      description: 'Combining selected data types from all profiles',
      icon: Database,
      status: 'pending',
      progress: 0
    },
    {
      id: 'finalization',
      label: 'Finalizing',
      description: 'Creating merged profile and generating reports',
      icon: FileText,
      status: 'pending',
      progress: 0
    }
  ]);

  // Real merge process
  useEffect(() => {
    const runMergeProcess = async () => {
      try {
        // Set up progress callback
        mergeEngine.setProgressCallback((message: string, progress: number) => {
          const stepIndex = Math.floor(progress * steps.length);
          const stepProgress = (progress * steps.length - stepIndex) * 100;
          
          setCurrentStep(Math.min(stepIndex, steps.length - 1));
          setOverallProgress(progress * 100);
          
          // Update current step
          setSteps(prevSteps => 
            prevSteps.map((step, index) => {
              if (index < stepIndex) {
                return { ...step, status: 'completed' as const, progress: 100 };
              } else if (index === stepIndex) {
                return { ...step, status: 'running' as const, progress: stepProgress };
              } else {
                return { ...step, status: 'pending' as const, progress: 0 };
              }
            })
          );
          
          // Calculate estimated time remaining
          const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
          if (progress > 0.05) {
            const totalEstimated = elapsed / progress;
            setEstimatedTimeRemaining(Math.max(0, totalEstimated - elapsed));
          }
        });
        
        // Run the actual merge
        const result = await mergeEngine.mergeProfiles(profiles, config, 'merged_profile');
        
        if (result.success) {
          setMergeStats(result.stats);
          setIsComplete(true);
          setEstimatedTimeRemaining(0);
          
          // Mark all steps as completed
          setSteps(prevSteps => 
            prevSteps.map(step => ({ ...step, status: 'completed' as const, progress: 100 }))
          );
          setOverallProgress(100);
          
          // Auto-complete after showing results
          setTimeout(() => {
            onComplete();
          }, 5000);
        } else {
          throw new Error('Merge operation failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Merge failed');
        
        // Mark current step as error
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === currentStep 
              ? { ...step, status: 'error' as const }
              : step
          )
        );
      }
    };

    runMergeProcess();
  }, []);

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.ceil(remainingSeconds)}s`;
  };

  const totalDataItems = Object.values(mergeStats).reduce(
    (sum, stats) => sum + (stats?.total || 0), 0
  );
  const totalAdded = Object.values(mergeStats).reduce(
    (sum, stats) => sum + (stats?.added || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {isComplete ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Play className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isComplete ? 'Merge Completed Successfully!' : 'Merging Firefox Profiles'}
          </h2>
          <p className="text-gray-600">
            {isComplete 
              ? 'Your profiles have been successfully merged into a new profile.'
              : 'Please wait while we merge your selected profiles...'
            }
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(estimatedTimeRemaining)} remaining</span>
              </div>
            )}
            <span className="font-medium text-lg">{Math.round(overallProgress)}%</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Profiles</p>
            <p className="text-xl font-bold text-gray-900">{profiles.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Step</p>
            <p className="text-xl font-bold text-blue-600">{currentStep + 1}/{steps.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Elapsed</p>
            <p className="text-xl font-bold text-green-600">
              {formatTime((new Date().getTime() - startTime.getTime()) / 1000)}
            </p>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Progress</h3>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStepStatusIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{step.label}</h4>
                    <span className="text-sm text-gray-600">{step.progress}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  
                  {step.status === 'running' || step.status === 'completed' ? (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          step.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Merge Statistics */}
      {Object.keys(mergeStats).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Merge Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(mergeStats).map(([dataType, stats]) => (
              <div key={dataType} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 capitalize mb-2">
                  {dataType.replace('_', ' ')}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Added:</span>
                    <span className="font-medium text-green-600">{stats.added}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Skipped:</span>
                    <span className="font-medium text-amber-600">{stats.skipped}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Summary</h4>
                <p className="text-sm text-blue-700">
                  Processed {totalDataItems.toLocaleString()} items, added {totalAdded.toLocaleString()} unique entries
                </p>
              </div>
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Merge Failed</h3>
            <p className="text-red-800 mb-6">{error}</p>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={onComplete}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Actions */}
      {isComplete && !error && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Merge Completed Successfully!</h3>
            <p className="text-green-800 mb-6">
              Your profiles have been merged into a new profile. You can now use it in Firefox.
            </p>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
                <ol className="text-sm text-gray-700 space-y-1 text-left">
                  <li>1. Open Firefox and navigate to <code className="bg-gray-100 px-1 rounded">about:profiles</code></li>
                  <li>2. Click "Create a New Profile" and follow the wizard</li>
                  <li>3. Choose "Use existing folder" and select your merged profile</li>
                  <li>4. Launch the new profile and verify your data</li>
                </ol>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </button>
                <button 
                  onClick={onComplete}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}