import React, { useState, useEffect } from 'react';
import { ProfileDiscovery } from './components/ProfileDiscovery';
import { ProfileManager } from './components/ProfileManager';
import { MergeConfiguration } from './components/MergeConfiguration';
import { MergeProgress } from './components/MergeProgress';
import { ProfileComparison } from './components/ProfileComparison';
import { BackupManager } from './components/BackupManager';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FirefoxProfile, MergeConfig, ConflictResolution, MergeDataType, CompressionType } from './types/types';

type ActiveView = 'discovery' | 'manager' | 'configuration' | 'progress' | 'comparison' | 'backup';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('discovery');
  const [profiles, setProfiles] = useState<FirefoxProfile[]>([]);
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

  const handleProfilesDiscovered = (discoveredProfiles: FirefoxProfile[]) => {
    setProfiles(discoveredProfiles);
    setActiveView('manager');
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

  const handleMergeComplete = () => {
    setIsProcessing(false);
    setActiveView('manager');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'discovery':
        return <ProfileDiscovery onProfilesDiscovered={handleProfilesDiscovered} />;
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
            onContinue={() => setActiveView('manager')}
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
      default:
        return <ProfileDiscovery onProfilesDiscovered={handleProfilesDiscovered} />;
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