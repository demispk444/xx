import React, { useState } from 'react';
import { MergeEngine } from '../utils/mergeEngine';
import { BrowserProfile, BookmarkEntry } from '../types/types';

interface BrowserDataViewerProps {
  profiles: BrowserProfile[] | any;
}

export function BrowserDataViewer({ profiles }: BrowserDataViewerProps) {
  const [activeTab, setActiveTab] = useState('bookmarks');

  const handleSave = async () => {
    const mergeEngine = new MergeEngine();
    const result = await mergeEngine.writeMergedProfile(profiles); // `profiles` here is the mergedData

    if (result.success && result.files) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        for (const file of result.files) {
          const fileHandle = await dirHandle.getFileHandle(file.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(file.content);
          await writable.close();
        }
        alert('Profile saved successfully!');
      } catch (error) {
        console.error('Error saving file:', error);
        alert('Failed to save profile.');
      }
    }
  };

  const renderContent = () => {
    const data = profiles[activeTab]?.data || [];
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL / Host</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folder / Path</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title || item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.url || item.host}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.folder || item.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Merged Data Preview</h2>
            <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
                Save Merged Profile
            </button>
        </div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('bookmarks')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookmarks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Bookmarks
          </button>
          {/* Add other tabs here */}
        </nav>
      </div>
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}
