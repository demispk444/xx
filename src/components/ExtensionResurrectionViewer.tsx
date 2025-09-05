import { useState, useEffect } from 'react';
import { Puzzle, ExternalLink, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { DataView, DataViewColumn } from './DataView';
import { ExtensionResurrectionManager, DetectedExtension, ResurrectionPlan } from '../utils/extensionResurrectionManager';
import { BrowserType } from '../types/types';

interface ExtensionResurrectionViewerProps {
  profiles: any[];
  onBack: () => void;
  addLog: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;
}

export function ExtensionResurrectionViewer({ profiles, onBack, addLog }: ExtensionResurrectionViewerProps) {
  const [detectedExtensions, setDetectedExtensions] = useState<DetectedExtension[]>([]);
  const [resurrectionPlan, setResurrectionPlan] = useState<ResurrectionPlan | null>(null);
  const [targetBrowser, setTargetBrowser] = useState<BrowserType>(BrowserType.CHROME);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'detected' | 'plan'>('detected');

  const resurrectionManager = new ExtensionResurrectionManager(addLog);

  useEffect(() => {
    startExtensionExtraction();
  }, []);

  const startExtensionExtraction = async () => {
    if (profiles.length === 0) {
      addLog('warning', 'No browser profiles available for extension extraction');
      return;
    }

    setIsProcessing(true);
    addLog('info', '═══ STARTING EXTENSION RESURRECTION ═══');
    
    try {
      const extensions = await resurrectionManager.extractExtensions(profiles);
      setDetectedExtensions(extensions);
      
      if (extensions.length > 0) {
        const plan = await resurrectionManager.createResurrectionPlan(extensions, targetBrowser);
        setResurrectionPlan(plan);
        addLog('success', `Extension analysis complete: ${plan.availableForInstall} can be reinstalled`);
      } else {
        addLog('warning', 'No extensions found in browser profiles');
      }
    } catch (error) {
      addLog('error', `Extension extraction failed: ${error}`);
    }
    
    setIsProcessing(false);
  };

  const updateResurrectionPlan = async (newTargetBrowser: BrowserType) => {
    if (detectedExtensions.length === 0) return;
    
    setTargetBrowser(newTargetBrowser);
    addLog('info', `Updating resurrection plan for ${newTargetBrowser}`);
    
    try {
      const plan = await resurrectionManager.createResurrectionPlan(detectedExtensions, newTargetBrowser);
      setResurrectionPlan(plan);
      addLog('success', `Plan updated: ${plan.availableForInstall} extensions available for ${newTargetBrowser}`);
    } catch (error) {
      addLog('error', `Failed to update resurrection plan: ${error}`);
    }
  };

  const generateInstallationScript = () => {
    if (!resurrectionPlan) return;
    
    const instructions = resurrectionManager.generateInstallationInstructions(resurrectionPlan, targetBrowser);
    const content = instructions.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extension_resurrection_${targetBrowser.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('success', `Installation instructions exported for ${targetBrowser}`);
  };

  const exportData = (format: 'csv' | 'json' | 'html', data: DetectedExtension[]) => {
    addLog('info', `Exporting detected extensions as ${format.toUpperCase()}`);
    
    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'csv':
        const headers = ['Name', 'Version', 'Enabled', 'Source Browser', 'Source Profile', 'Store Match', 'Confidence'];
        const rows = [headers.join(',')];
        data.forEach(ext => {
          rows.push([
            `"${ext.name}"`,
            `"${ext.version}"`,
            ext.enabled ? 'Yes' : 'No',
            `"${ext.sourceBrowser}"`,
            `"${ext.sourceProfile}"`,
            `"${ext.storeMatch?.name || 'Unknown'}"`,
            `${Math.round(ext.confidence * 100)}%`
          ].join(','));
        });
        content = rows.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;
        
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
        
      case 'html':
        content = `
          <!DOCTYPE html>
          <html>
          <head><title>Detected Extensions</title></head>
          <body>
            <h1>Detected Extensions Report</h1>
            <table border="1">
              <thead>
                <tr><th>Name</th><th>Version</th><th>Enabled</th><th>Source</th><th>Store Match</th><th>Confidence</th></tr>
              </thead>
              <tbody>
                ${data.map(ext => `
                  <tr>
                    <td>${ext.name}</td>
                    <td>${ext.version}</td>
                    <td>${ext.enabled ? 'Yes' : 'No'}</td>
                    <td>${ext.sourceBrowser} - ${ext.sourceProfile}</td>
                    <td>${ext.storeMatch?.name || 'Unknown'}</td>
                    <td>${Math.round(ext.confidence * 100)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
        mimeType = 'text/html';
        extension = 'html';
        break;
    }

    if (content) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detected_extensions_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLog('success', `Extensions exported as ${extension.toUpperCase()}`);
    }
  };

  const extensionColumns: DataViewColumn[] = [
    { key: 'name', label: 'Extension Name', width: '25%' },
    { key: 'version', label: 'Version', width: '10%' },
    { 
      key: 'enabled', 
      label: 'Status', 
      width: '8%',
      render: (enabled) => enabled ? (
        <span className="text-green-600 font-medium">Enabled</span>
      ) : (
        <span className="text-gray-500">Disabled</span>
      )
    },
    { key: 'sourceBrowser', label: 'Source', width: '12%' },
    { 
      key: 'storeMatch',
      label: 'Store Match',
      width: '20%',
      render: (storeMatch) => storeMatch ? (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700">{storeMatch.name}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <span className="text-orange-600">Unknown</span>
        </div>
      )
    },
    { 
      key: 'confidence',
      label: 'Confidence',
      width: '10%',
      render: (confidence) => {
        const percentage = Math.round(confidence * 100);
        const color = percentage >= 90 ? 'text-green-600' : 
                     percentage >= 70 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-medium ${color}`}>{percentage}%</span>;
      }
    },
    {
      key: 'storeMatch',
      label: 'Install',
      width: '15%',
      sortable: false,
      render: (storeMatch) => {
        if (!storeMatch) return <span className="text-gray-400">N/A</span>;
        
        const storeUrl = targetBrowser === BrowserType.FIREFOX 
          ? storeMatch.firefoxStoreUrl
          : targetBrowser === BrowserType.EDGE
          ? storeMatch.edgeStoreUrl
          : storeMatch.chromeStoreUrl;
          
        return storeUrl ? (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="text-xs">Install</span>
          </a>
        ) : (
          <span className="text-gray-400 text-xs">Not available</span>
        );
      }
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Puzzle className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-lg font-medium text-gray-900">Extension Resurrection</h1>
              <div className="text-sm text-gray-600">
                {detectedExtensions.length} extensions detected | 
                {resurrectionPlan ? ` ${resurrectionPlan.availableForInstall} can be reinstalled` : ' Analysis pending'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Target Browser Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Target Browser:</label>
              <select
                value={targetBrowser}
                onChange={(e) => updateResurrectionPlan(e.target.value as BrowserType)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={BrowserType.CHROME}>Chrome</option>
                <option value={BrowserType.FIREFOX}>Firefox</option>
                <option value={BrowserType.EDGE}>Edge</option>
              </select>
            </div>

            <button
              onClick={generateInstallationScript}
              disabled={!resurrectionPlan || isProcessing}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Installation Guide</span>
            </button>
            
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
            onClick={() => setActiveTab('detected')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'detected'
                ? 'border-purple-500 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Detected Extensions ({detectedExtensions.length})
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'plan'
                ? 'border-purple-500 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Resurrection Plan
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'detected' && (
          <DataView
            title={`Detected Extensions - ${targetBrowser}`}
            data={detectedExtensions}
            columns={extensionColumns}
            onExport={(format) => exportData(format, detectedExtensions)}
            className="h-full"
          />
        )}
        
        {activeTab === 'plan' && resurrectionPlan && (
          <div className="p-6 bg-white h-full overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resurrection Plan for {targetBrowser}</h2>
                
                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <div className="text-2xl font-bold text-blue-600">{resurrectionPlan.totalExtensions}</div>
                    <div className="text-sm text-blue-800">Total Extensions</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="text-2xl font-bold text-green-600">{resurrectionPlan.availableForInstall}</div>
                    <div className="text-sm text-green-800">Available to Install</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded p-4">
                    <div className="text-2xl font-bold text-orange-600">{resurrectionPlan.unknownExtensions.length}</div>
                    <div className="text-sm text-orange-800">Need Manual Search</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <div className="text-2xl font-bold text-red-600">{resurrectionPlan.deprecated}</div>
                    <div className="text-sm text-red-800">Deprecated</div>
                  </div>
                </div>

                {/* Installation Links */}
                {resurrectionPlan.installationGroups[targetBrowser.toLowerCase() as keyof typeof resurrectionPlan.installationGroups]?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Direct Installation Links</h3>
                    <div className="space-y-3">
                      {resurrectionPlan.installationGroups[targetBrowser.toLowerCase() as keyof typeof resurrectionPlan.installationGroups].map((item, index) => {
                        const storeUrl = targetBrowser === BrowserType.FIREFOX 
                          ? item.extension.firefoxStoreUrl
                          : targetBrowser === BrowserType.EDGE
                          ? item.extension.edgeStoreUrl
                          : item.extension.chromeStoreUrl;
                          
                        return (
                          <div key={index} className="border border-gray-200 rounded p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{item.extension.name}</div>
                                <div className="text-sm text-gray-600">{item.extension.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Original: v{item.originalExtension.version} from {item.originalExtension.sourceBrowser}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {item.extension.category}
                                </span>
                                {storeUrl && (
                                  <a
                                    href={storeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Install</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unknown Extensions */}
                {resurrectionPlan.unknownExtensions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Unknown Extensions (Manual Search Required)</h3>
                    <div className="space-y-2">
                      {resurrectionPlan.unknownExtensions.map((ext, index) => (
                        <div key={index} className="border border-orange-200 rounded p-3 bg-orange-50">
                          <div className="font-medium text-gray-900">{ext.name} v{ext.version}</div>
                          <div className="text-sm text-gray-600">{ext.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Source: {ext.sourceBrowser} - Search manually in {targetBrowser} store
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
      </div>
    </div>
  );
}