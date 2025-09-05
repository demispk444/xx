import { useState, useEffect } from 'react';
import { Download, FileText, Globe, Folder, Layers } from 'lucide-react';
import { DataView, DataViewColumn } from './DataView';
import { TabSynthesizer, TabCollection, SynthesisResult } from '../utils/tabSynthesizer';

interface TabSynthesisViewerProps {
  backupFiles: File[];
  onBack: () => void;
  addLog: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;
}

export function TabSynthesisViewer({ backupFiles, onBack, addLog }: TabSynthesisViewerProps) {
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<TabCollection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'tabs'>('collections');

  const tabSynthesizer = new TabSynthesizer(addLog);

  useEffect(() => {
    if (backupFiles.length > 0) {
      startTabSynthesis();
    }
  }, [backupFiles]);

  const startTabSynthesis = async () => {
    setIsProcessing(true);
    addLog('info', '═══ STARTING TAB SYNTHESIS ═══');
    addLog('info', `Processing ${backupFiles.length} tab backup files`);

    try {
      const backups = [];
      
      for (const file of backupFiles) {
        addLog('info', `Processing ${file.name}...`);
        
        try {
          const content = await file.text();
          let backup;
          
          if (file.name.toLowerCase().includes('onetab') || file.name.endsWith('.txt')) {
            backup = await tabSynthesizer.parseOneTabBackup(content, file.name);
          } else if (file.name.toLowerCase().includes('session') && file.name.endsWith('.json')) {
            backup = await tabSynthesizer.parseSessionBuddyBackup(content, file.name);
          } else if (file.name.toLowerCase().includes('tabmanager') && file.name.endsWith('.json')) {
            backup = await tabSynthesizer.parseTabManagerPlusBackup(content, file.name);
          } else {
            // Try to auto-detect format
            if (content.startsWith('{') || content.startsWith('[')) {
              // JSON format - try Session Buddy first
              try {
                backup = await tabSynthesizer.parseSessionBuddyBackup(content, file.name);
              } catch {
                backup = await tabSynthesizer.parseTabManagerPlusBackup(content, file.name);
              }
            } else {
              // Text format - assume OneTab
              backup = await tabSynthesizer.parseOneTabBackup(content, file.name);
            }
          }
          
          backups.push(backup);
          addLog('success', `${file.name}: ${backup.tabCount} tabs extracted`);
        } catch (error) {
          addLog('error', `Failed to process ${file.name}: ${error}`);
        }
      }

      if (backups.length > 0) {
        const result = await tabSynthesizer.synthesizeTabBackups(backups);
        setSynthesisResult(result);
        
        if (result.collections.length > 0) {
          setSelectedCollection(result.collections[0]); // Default to first collection
        }
        
        addLog('success', '═══ TAB SYNTHESIS COMPLETE ═══');
        addLog('info', `${result.totalTabs} tabs synthesized | ${result.duplicateTabs} duplicates found`);
      } else {
        addLog('warning', 'No tab backups could be processed');
      }
    } catch (error) {
      addLog('error', `Tab synthesis failed: ${error}`);
    }
    
    setIsProcessing(false);
  };

  const exportCollection = (collection: TabCollection, format: 'bookmarks' | 'json' | 'csv') => {
    addLog('info', `Exporting ${collection.name} as ${format}`);
    
    let content = '';
    let mimeType = '';
    let extension = '';
    let filename = `${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}`;

    switch (format) {
      case 'bookmarks':
        content = tabSynthesizer.exportAsBookmarks(collection);
        mimeType = 'text/html';
        extension = 'html';
        filename += '_bookmarks';
        break;
        
      case 'json':
        content = tabSynthesizer.exportAsJSON(collection);
        mimeType = 'application/json';
        extension = 'json';
        break;
        
      case 'csv':
        content = tabSynthesizer.exportAsCSV(collection);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('success', `Collection exported as ${extension.toUpperCase()}`);
  };

  const tabColumns: DataViewColumn[] = [
    { key: 'title', label: 'Title', width: '40%' },
    { key: 'url', label: 'URL', width: '35%' },
    { key: 'sourceType', label: 'Source', width: '12%' },
    { 
      key: 'savedDate', 
      label: 'Saved Date', 
      width: '13%',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

  const collectionColumns: DataViewColumn[] = [
    { key: 'name', label: 'Collection Name', width: '30%' },
    { key: 'description', label: 'Description', width: '35%' },
    { key: 'totalTabs', label: 'Tabs', width: '10%' },
    { 
      key: 'createdDate', 
      label: 'Created', 
      width: '15%',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      sortable: false,
      render: (_, collection: TabCollection) => (
        <button
          onClick={() => setSelectedCollection(collection)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View Tabs
        </button>
      )
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Layers className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-medium text-gray-900">Tab Synthesis Engine</h1>
              <div className="text-sm text-gray-600">
                {synthesisResult ? 
                  `${synthesisResult.totalTabs} tabs | ${synthesisResult.uniqueUrls} unique URLs | ${synthesisResult.duplicateTabs} duplicates` :
                  `Processing ${backupFiles.length} backup files...`
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedCollection && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => exportCollection(selectedCollection, 'bookmarks')}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  <Globe className="h-4 w-4" />
                  <span>Bookmarks</span>
                </button>
                <button
                  onClick={() => exportCollection(selectedCollection, 'json')}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => exportCollection(selectedCollection, 'csv')}
                  className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            )}
            
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="flex">
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'collections'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Collections ({synthesisResult?.collections.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('tabs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'tabs'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            disabled={!selectedCollection}
          >
            Tabs ({selectedCollection?.totalTabs || 0})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isProcessing && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg font-medium text-gray-900">Processing tab backups...</div>
              <div className="text-sm text-gray-600">Analyzing and synthesizing tab data</div>
            </div>
          </div>
        )}

        {!isProcessing && synthesisResult && (
          <>
            {activeTab === 'collections' && (
              <DataView
                title="Tab Collections"
                data={synthesisResult.collections}
                columns={collectionColumns}
                onExport={() => {}} // Collections don't need export
                className="h-full"
              />
            )}
            
            {activeTab === 'tabs' && selectedCollection && (
              <DataView
                title={`${selectedCollection.name} - ${selectedCollection.totalTabs} Tabs`}
                data={selectedCollection.tabs}
                columns={tabColumns}
                onExport={(format) => {
                  if (format === 'csv') exportCollection(selectedCollection, 'csv');
                  else if (format === 'json') exportCollection(selectedCollection, 'json');
                  else exportCollection(selectedCollection, 'bookmarks');
                }}
                className="h-full"
              />
            )}
          </>
        )}

        {!isProcessing && !synthesisResult && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900">No Tab Backups</div>
              <div className="text-sm text-gray-600">Upload OneTab, Session Buddy, or Tab Manager Plus backup files</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}