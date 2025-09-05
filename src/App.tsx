import { useState } from 'react';
import { BrowserDataViewer } from './components/BrowserDataViewer';
import { ProfileDiscovery } from './components/ProfileDiscovery';
import { ProfileManager } from './components/ProfileManager';
import { MergeConfiguration } from './components/MergeConfiguration';
import { MergeProgress } from './components/MergeProgress';
import { ProfileComparison } from './components/ProfileComparison';
import { BackupManager } from './components/BackupManager';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FirefoxProfile, DiscoveryResult, MergeConfig, ConflictResolution, MergeDataType, CompressionType, BrowserType } from './types/types';

type ActiveView = 'discovery' | 'manager' | 'configuration' | 'progress' | 'comparison' | 'backup' | 'dataviewer' | 'mergeddataviewer';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('discovery');
  const [profiles, setProfiles] = useState<FirefoxProfile[]>([]);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<FirefoxProfile[]>([]);
  const [mergeConfig, setMergeConfig] = useState<MergeConfig>({
    mergeTypes: [MergeDataType.ALL],
    conflictResolution: ConflictResolution.KEEP_NEWEST,
    dryRun: false,
    backup: true,
    compression: CompressionType.ZIP,
    outputLocation: null,
    profileCleanup: true,
    sessionRecovery: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPreviewData, setMergedPreviewData] = useState<any | null>(null);

  const handleDataSourcesDiscovered = (result: DiscoveryResult) => {
    setDiscoveryResult(result);
    // Convert browser profiles to Firefox profiles for backward compatibility
    const firefoxProfiles = result.browserProfiles
      .filter(p => p.browserType === BrowserType.FIREFOX)
      .map(p => ({ ...p, firefoxVersion: p.browserVersion } as FirefoxProfile));
    setProfiles(firefoxProfiles);
    // Go directly to the new NirSoft-style data viewer
    setActiveView('dataviewer');
  };

  const handleProfileSelection = (profiles: FirefoxProfile[]) => {
    setSelectedProfiles(profiles);
  };

  const handleStartMerge = () => {
    if (selectedProfiles.length < 2) {
      alert('Please select at least two profiles to merge.');
      return;
    }
    setActiveView('progress');
    setIsProcessing(true);
  };

  const handleMergeComplete = (mergedData: any) => {
    setMergedPreviewData(mergedData);
    setIsProcessing(false);
    setActiveView('mergeddataviewer');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'discovery':
        return <ProfileDiscovery onDataSourcesDiscovered={handleDataSourcesDiscovered} />;
      case 'manager':
        return (
          <ProfileManager
            profiles={profiles}
            selectedProfiles={selectedProfiles}
            onProfileSelection={handleProfileSelection}
            onStartMerge={handleStartMerge}
            onShowComparison={() => setActiveView('comparison')}
          />
        );
      case 'configuration':
        return (
          <MergeConfiguration
            config={mergeConfig}
            onConfigChange={setMergeConfig}
            onBack={() => setActiveView('manager')}
            onContinue={handleStartMerge}
          />
        );
      case 'progress':
        return (
          <MergeProgress
            profiles={selectedProfiles}
            config={mergeConfig}
            onComplete={handleMergeComplete}
          />
        );
      case 'comparison':
        return (
          <ProfileComparison
            profiles={selectedProfiles}
            onBack={() => setActiveView('manager')}
          />
        );
      case 'backup':
        return (
          <BackupManager
            profiles={profiles}
            onBack={() => setActiveView('manager')}
          />
        );
      case 'dataviewer':
        return discoveryResult ? (
          <BrowserDataViewer profiles={discoveryResult.browserProfiles} />
        ) : (
          <div className="text-center py-8">No data sources discovered yet</div>
        );
      case 'mergeddataviewer':
        return mergedPreviewData ? (
          <BrowserDataViewer profiles={mergedPreviewData} />
        ) : (
          <div className="text-center py-8">No merged data to display.</div>
        );
      default:
        return <ProfileDiscovery onDataSourcesDiscovered={handleDataSourcesDiscovered} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="flex">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          profilesCount={profiles.length}
          selectedCount={selectedProfiles.length}
          isProcessing={isProcessing}
        />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
