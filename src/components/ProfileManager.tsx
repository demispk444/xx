import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Play,
  GitCompare,
  RefreshCw,
  Trash2,
  Settings
} from 'lucide-react';
import { FirefoxProfile } from '../types/types';
import { ProfileCard } from './ProfileCard';
import { ProfileFilters } from './ProfileFilters';

interface ProfileManagerProps {
  profiles: FirefoxProfile[];
  selectedProfiles: FirefoxProfile[];
  onProfileSelection: (profiles: FirefoxProfile[]) => void;
  onStartMerge: () => void;
  onShowComparison: () => void;
}

export function ProfileManager({ 
  profiles, 
  selectedProfiles, 
  onProfileSelection, 
  onStartMerge,
  onShowComparison 
}: ProfileManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minSize: '',
    maxSize: '',
    profileType: '',
    validOnly: false
  });

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    let filtered = profiles.filter(profile => {
      // Search filter
      if (searchTerm && !profile.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Size filters
      if (filters.minSize && profile.size < parseFloat(filters.minSize) * 1024 * 1024) {
        return false;
      }
      if (filters.maxSize && profile.size > parseFloat(filters.maxSize) * 1024 * 1024) {
        return false;
      }

      // Profile type filter
      if (filters.profileType && profile.profileType !== filters.profileType) {
        return false;
      }

      // Valid only filter
      if (filters.validOnly && !profile.validation.isValid) {
        return false;
      }

      return true;
    });

    // Sort profiles
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [profiles, searchTerm, sortBy, sortOrder, filters]);

  const toggleProfileSelection = (profile: FirefoxProfile) => {
    const isSelected = selectedProfiles.some(p => p.id === profile.id);
    if (isSelected) {
      onProfileSelection(selectedProfiles.filter(p => p.id !== profile.id));
    } else {
      onProfileSelection([...selectedProfiles, profile]);
    }
  };

  const selectAll = () => {
    const validProfiles = filteredProfiles.filter(p => p.validation.isValid);
    onProfileSelection(validProfiles);
  };

  const clearSelection = () => {
    onProfileSelection([]);
  };

  const getProfileStats = () => {
    const totalSize = profiles.reduce((sum, p) => sum + p.size, 0);
    const validProfiles = profiles.filter(p => p.validation.isValid).length;
    const selectedSize = selectedProfiles.reduce((sum, p) => sum + p.size, 0);

    return {
      total: profiles.length,
      valid: validProfiles,
      totalSize: totalSize / (1024 * 1024),
      selectedSize: selectedSize / (1024 * 1024)
    };
  };

  const stats = getProfileStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile Manager</h2>
            <p className="text-gray-600">Select profiles to merge and configure options</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={onShowComparison}
              disabled={selectedProfiles.length < 2}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <GitCompare className="h-4 w-4" />
              <span>Compare</span>
            </button>
            <button 
              onClick={onStartMerge}
              disabled={selectedProfiles.length < 2}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
            >
              <Play className="h-4 w-4" />
              <span>Start Merge</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Profiles</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Valid Profiles</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Total Size</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSize.toFixed(1)} MB</p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900">Selected</p>
                <p className="text-2xl font-bold text-orange-600">{selectedProfiles.length}</p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search profiles by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Options */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="date">Sort by Date</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
              showFilters 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* Selection Actions */}
          <div className="flex space-x-2">
            <button
              onClick={selectAll}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Select All Valid
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <ProfileFilters filters={filters} onFiltersChange={setFilters} />
        )}
      </div>

      {/* Selected Profiles Summary */}
      {selectedProfiles.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900 mb-1">
                {selectedProfiles.length} Profile{selectedProfiles.length !== 1 ? 's' : ''} Selected
              </h3>
              <p className="text-sm text-green-700">
                Total size: {stats.selectedSize.toFixed(2)} MB • Ready for merging
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Ready to Merge</span>
            </div>
          </div>
        </div>
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isSelected={selectedProfiles.some(p => p.id === profile.id)}
            onToggleSelection={() => toggleProfileSelection(profile)}
          />
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profiles Found</h3>
          <p className="text-gray-600 mb-4">
            No profiles match your current search and filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({
                minSize: '',
                maxSize: '',
                profileType: '',
                validOnly: false
              });
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}