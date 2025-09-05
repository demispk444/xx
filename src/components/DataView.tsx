import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Download } from 'lucide-react';

export interface DataViewColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataViewProps {
  title: string;
  data: any[];
  columns: DataViewColumn[];
  onExport: (format: 'csv' | 'json' | 'html') => void;
  className?: string;
}

export function DataView({ title, data, columns, onExport, className = '' }: DataViewProps) {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply filter
    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase();
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm)
        )
      );
    }

    // Apply sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === bVal) return 0;
        
        let result = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          result = aVal.localeCompare(bVal);
        } else if (aVal instanceof Date && bVal instanceof Date) {
          result = aVal.getTime() - bVal.getTime();
        } else {
          result = aVal < bVal ? -1 : 1;
        }
        
        return sortDirection === 'desc' ? -result : result;
      });
    }

    return filtered;
  }, [data, filterText, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-300 ${className}`}>
      {/* Header with title and controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium text-sm text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500">
            {processedData.length} of {data.length} items
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filter */}
          <div className="flex items-center space-x-1">
            <Search className="h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Filter..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                <button
                  onClick={() => { onExport('csv'); setShowExportMenu(false); }}
                  className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => { onExport('json'); setShowExportMenu(false); }}
                  className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => { onExport('html'); setShowExportMenu(false); }}
                  className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100"
                >
                  Export as HTML
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left px-2 py-1 border-b border-gray-300 font-medium text-gray-700 ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-200' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                {columns.map((column) => (
                  <td key={column.key} className="px-2 py-1 text-gray-900">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {processedData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            {filterText ? 'No items match the current filter' : 'No data available'}
          </div>
        )}
      </div>
    </div>
  );
}