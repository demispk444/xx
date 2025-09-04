import React, { useState, useEffect } from 'react';
import { ArrowLeft, GitCompare, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { FirefoxProfile, ComparisonData } from '../types/types';
import { ProfileAnalysisService } from '../utils/profileAnalysis';

interface ProfileComparisonProps {
  profiles: FirefoxProfile[];
  onBack: () => void;
}

export function ProfileComparison({ profiles, onBack }: ProfileComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<[FirefoxProfile, FirefoxProfile] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisService = new ProfileAnalysisService();

  useEffect(() => {
    if (profiles.length >= 2) {
      const [profile1, profile2] = profiles.slice(0, 2);
      setSelectedProfiles([profile1, profile2]);
      
      // Perform real comparison analysis
      performComparison(profile1, profile2);
    }
  }, [profiles]);

  const performComparison = async (profile1: FirefoxProfile, profile2: FirefoxProfile) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const comparisonResult = await analysisService.compareProfiles(profile1, profile2);
      setComparison(comparisonResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
      console.error('Profile comparison error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getComparisonColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComparisonBgColor = (similarity: number) => {
    if (similarity >= 0.8) return 'bg-green-50 border-green-200';
    if (similarity >= 0.5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (!selectedProfiles) {
    return (
      <div className="text-center py-12">
        <GitCompare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Profiles to Compare</h3>
        <p className="text-gray-600">Select at least two profiles to see a comparison.</p>
      </div>
    );
  }

  const [profile1, profile2] = selectedProfiles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Comparison</h2>
            <p className="text-gray-600">Detailed analysis of differences between selected profiles</p>
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

      {/* Profile Headers */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{profile1.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Size: {(profile1.size / (1024 * 1024)).toFixed(2)} MB</p>
              <p>Type: {profile1.profileType}</p>
              <p>Modified: {profile1.lastModified.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{profile2.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Size: {(profile2.size / (1024 * 1024)).toFixed(2)} MB</p>
              <p>Type: {profile2.profileType}</p>
              <p>Modified: {profile2.lastModified.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {(isAnalyzing || !comparison) && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Profiles...</h3>
            <p className="text-gray-600">Reading profile data and calculating similarities...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Comparison Failed</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => selectedProfiles && performComparison(selectedProfiles[0], selectedProfiles[1])}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && !isAnalyzing && !error && (
        <>
          {/* Overall Similarity */}
          <div className={`rounded-xl border-2 p-6 ${getComparisonBgColor(comparison.similarityScore)}`}>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <TrendingUp className={`h-8 w-8 ${getComparisonColor(comparison.similarityScore)}`} />
                <h3 className="text-2xl font-bold text-gray-900">
                  Overall Similarity: {(comparison.similarityScore * 100).toFixed(0)}%
                </h3>
              </div>
              <p className="text-gray-700">
                {comparison.similarityScore >= 0.8 
                  ? 'These profiles are very similar. Merging may result in mostly duplicate data.'
                  : comparison.similarityScore >= 0.5
                    ? 'These profiles have moderate differences. Merging will combine complementary data.'
                    : 'These profiles are quite different. Merging will significantly expand your data.'
                }
              </p>
            </div>
          </div>

          {/* Detailed Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Comparison</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(comparison).map(([dataType, data]) => {
                if (dataType === 'similarityScore') return null;
                
                const similarity = data.similarity;
                const dataTypeLabel = dataType.charAt(0).toUpperCase() + dataType.slice(1);
                
                return (
                  <div key={dataType} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{dataTypeLabel}</h4>
                      <span className={`text-sm font-medium ${getComparisonColor(similarity)}`}>
                        {(similarity * 100).toFixed(0)}% similar
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Profile 1:</span>
                        <span className="font-medium">{data.count1.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Profile 2:</span>
                        <span className="font-medium">{data.count2.toLocaleString()}</span>
                      </div>
                      {data.common !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Common:</span>
                          <span className="font-medium text-green-600">{data.common.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Total After Merge:</span>
                        <span className="font-medium text-blue-600">
                          {(data.count1 + data.count2 - (data.common || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            similarity >= 0.8 ? 'bg-green-500' :
                            similarity >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${similarity * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Merge Recommendations</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  {comparison.similarityScore >= 0.8 ? (
                    <>
                      <p>• These profiles are very similar - consider if merging is necessary</p>
                      <p>• Use "Keep Newest" conflict resolution to avoid outdated data</p>
                      <p>• Enable dry-run mode first to preview the minimal changes</p>
                    </>
                  ) : comparison.similarityScore >= 0.5 ? (
                    <>
                      <p>• Good candidates for merging with complementary data</p>
                      <p>• Consider "Keep All" strategy to preserve maximum data</p>
                      <p>• Review extension conflicts before merging</p>
                    </>
                  ) : (
                    <>
                      <p>• Excellent candidates for merging - will significantly expand data</p>
                      <p>• Use "Keep Newest" for most recent preferences and settings</p>
                      <p>• Expect substantial increase in profile size after merge</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}