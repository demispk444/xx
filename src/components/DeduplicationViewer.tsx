import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Eye, Users } from 'lucide-react';
import { DuplicateGroup, DeduplicationResult } from '../utils/deduplicationEngine';
import { UniversalBookmark, UniversalHistoryEntry, UniversalLogin } from '../utils/universalDataNormalizer';

interface DeduplicationViewerProps {
  result: DeduplicationResult;
  onApplyResolution: (resolutions: Map<string, ResolutionChoice>) => void;
  onBack: () => void;
}

interface ResolutionChoice {
  groupId: string;
  action: 'keep_suggested' | 'keep_specific' | 'keep_all' | 'manual_merge';
  keepItem?: UniversalBookmark | UniversalHistoryEntry | UniversalLogin;
  customMerge?: UniversalBookmark | UniversalHistoryEntry | UniversalLogin;
}

export function DeduplicationViewer({ 
  result, 
  onApplyResolution, 
  onBack 
}: DeduplicationViewerProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [resolutions, setResolutions] = useState<Map<string, ResolutionChoice>>(new Map());
  const [showPreview, setShowPreview] = useState(false);

  // Initialize resolutions with suggested choices
  useEffect(() => {
    const initialResolutions = new Map<string, ResolutionChoice>();
    result.duplicateGroups.forEach(group => {
      initialResolutions.set(group.id, {
        groupId: group.id,
        action: 'keep_suggested',
        keepItem: group.suggestedKeep
      });
    });
    setResolutions(initialResolutions);
  }, [result]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const updateResolution = (groupId: string, resolution: Partial<ResolutionChoice>) => {
    const current = resolutions.get(groupId) || { groupId, action: 'keep_suggested' };
    setResolutions(new Map(resolutions.set(groupId, { ...current, ...resolution })));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const renderBookmarkComparison = (bookmarks: UniversalBookmark[]) => (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {bookmark.sourceBrowser} - {bookmark.sourceProfile.split('/').pop()}
            </span>
            <span className="text-xs text-gray-500">
              Added: {bookmark.dateAdded.toLocaleDateString()}
            </span>
          </div>
          <div className="font-medium text-sm text-gray-900 mb-1">{bookmark.title}</div>
          <div className="text-xs text-blue-600 break-all">{bookmark.url}</div>
          <div className="text-xs text-gray-500 mt-1">
            Folder: {bookmark.folder.join(' > ') || 'Root'} | Visits: {bookmark.visitCount || 0}
          </div>
        </div>
      ))}
    </div>
  );

  const renderHistoryComparison = (entries: UniversalHistoryEntry[]) => (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {entry.sourceBrowser} - {entry.sourceProfile.split('/').pop()}
            </span>
            <span className="text-xs text-gray-500">
              Last: {entry.lastVisit.toLocaleDateString()}
            </span>
          </div>
          <div className="font-medium text-sm text-gray-900 mb-1">{entry.title}</div>
          <div className="text-xs text-blue-600 break-all mb-1">{entry.url}</div>
          <div className="text-xs text-gray-500">
            Visits: {entry.visitCount} | First: {entry.firstVisit.toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );

  const renderLoginComparison = (logins: UniversalLogin[]) => (
    <div className="space-y-2">
      {logins.map((login) => (
        <div key={login.id} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {login.sourceBrowser} - {login.sourceProfile.split('/').pop()}
            </span>
            <span className="text-xs text-gray-500">
              Used: {login.dateLastUsed.toLocaleDateString()}
            </span>
          </div>
          <div className="font-medium text-sm text-gray-900 mb-1">{login.domain}</div>
          <div className="text-sm text-gray-700 mb-1">Username: {login.username}</div>
          <div className="text-xs text-gray-500">
            Created: {login.dateCreated.toLocaleDateString()} | Times used: {login.timesUsed}
          </div>
        </div>
      ))}
    </div>
  );

  const renderResolutionControls = (group: DuplicateGroup) => {
    const resolution = resolutions.get(group.id);
    
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="font-medium text-sm text-blue-900 mb-2">Resolution Options</div>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name={`resolution_${group.id}`}
              checked={resolution?.action === 'keep_suggested'}
              onChange={() => updateResolution(group.id, { 
                action: 'keep_suggested', 
                keepItem: group.suggestedKeep 
              })}
              className="text-blue-600"
            />
            <span className="text-sm">Keep suggested item (recommended)</span>
          </label>
          
          <div className="ml-6 space-y-1">
            {group.items.map((item) => (
              <label key={item.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`resolution_${group.id}`}
                  checked={resolution?.action === 'keep_specific' && resolution?.keepItem?.id === item.id}
                  onChange={() => updateResolution(group.id, { 
                    action: 'keep_specific', 
                    keepItem: item 
                  })}
                  className="text-blue-600"
                />
                <span className="text-xs text-gray-600">
                  Keep: {item.title || item.domain} ({item.sourceBrowser})
                  {item.id === group.suggestedKeep?.id && (
                    <span className="ml-1 text-green-600">★ Suggested</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name={`resolution_${group.id}`}
              checked={resolution?.action === 'keep_all'}
              onChange={() => updateResolution(group.id, { action: 'keep_all' })}
              className="text-blue-600"
            />
            <span className="text-sm">Keep all (no deduplication)</span>
          </label>
        </div>
      </div>
    );
  };

  const hasUnresolvedConflicts = Array.from(resolutions.values()).some(r => 
    !r.action || r.action === 'manual_merge'
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Duplicate Resolution</h1>
            <div className="text-sm text-gray-600 mt-1">
              Found {result.duplicateGroups.length} duplicate groups | 
              {result.potentialMerges} potential merges | 
              {result.requiresUserReview} require review
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
            
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={() => onApplyResolution(resolutions)}
              disabled={hasUnresolvedConflicts}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Resolution
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate groups */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {result.duplicateGroups.map((group) => (
            <div key={group.id} className="bg-white border border-gray-300 rounded">
              {/* Group header */}
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">
                      {group.type.charAt(0).toUpperCase() + group.type.slice(1)} Duplicates
                    </span>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(group.confidence)}`}>
                    {getConfidenceLabel(group.confidence)} ({Math.round(group.confidence * 100)}%)
                  </span>
                  
                  <span className="text-sm text-gray-600">{group.reason}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{group.items.length} items</span>
                  {expandedGroups.has(group.id) ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Group content */}
              {expandedGroups.has(group.id) && (
                <div className="border-t border-gray-200 p-4">
                  {/* Side-by-side comparison */}
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Side-by-Side Comparison</h4>
                    {group.type === 'bookmark' && renderBookmarkComparison(group.items)}
                    {group.type === 'history' && renderHistoryComparison(group.items)}
                    {group.type === 'login' && renderLoginComparison(group.items)}
                  </div>

                  {/* Resolution controls */}
                  {renderResolutionControls(group)}
                </div>
              )}
            </div>
          ))}
        </div>

        {result.duplicateGroups.length === 0 && (
          <div className="text-center py-12">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h3>
            <p className="text-gray-600">Your data appears to be clean with no duplicate entries detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}