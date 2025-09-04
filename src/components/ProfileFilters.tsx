import React from 'react';
import { X } from 'lucide-react';

interface ProfileFiltersProps {
  filters: {
    minSize: string;
    maxSize: string;
    profileType: string;
    validOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

export function ProfileFilters({ filters, onFiltersChange }: ProfileFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      minSize: '',
      maxSize: '',
      profileType: '',
      validOnly: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Advanced Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Size (MB)
          </label>
          <input
            type="number"
            value={filters.minSize}
            onChange={(e) => updateFilter('minSize', e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Size (MB)
          </label>
          <input
            type="number"
            value={filters.maxSize}
            onChange={(e) => updateFilter('maxSize', e.target.value)}
            placeholder="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Type
          </label>
          <select
            value={filters.profileType}
            onChange={(e) => updateFilter('profileType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Types</option>
            <option value="default">Default</option>
            <option value="default-release">Default Release</option>
            <option value="default-esr">Default ESR</option>
            <option value="developer">Developer</option>
            <option value="nightly">Nightly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={filters.validOnly}
              onChange={(e) => updateFilter('validOnly', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-700">Valid profiles only</span>
          </label>
        </div>
      </div>
    </div>
  );
}