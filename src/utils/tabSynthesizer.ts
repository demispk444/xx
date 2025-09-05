// Tab Synthesizer - Unify OneTab/Session Buddy/Tab Manager Plus backups
// Creates unified tab collections with smart grouping and export capabilities

export interface TabBackup {
  id: string;
  source: string; // OneTab, Session Buddy, etc.
  type: 'onetab' | 'session_buddy' | 'tab_manager_plus' | 'browser_session';
  name: string;
  dateCreated: Date;
  tabCount: number;
  originalFormat: string;
  rawData: any;
}

export interface UnifiedTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  windowId?: number;
  groupName?: string;
  groupColor?: string;
  index: number;
  pinned: boolean;
  active: boolean;
  savedDate: Date;
  sourceBackup: string;
  sourceType: string;
}

export interface TabCollection {
  id: string;
  name: string;
  description: string;
  tabs: UnifiedTab[];
  createdDate: Date;
  modifiedDate: Date;
  sourceBackups: string[];
  totalTabs: number;
  windowGroups: Map<number, UnifiedTab[]>;
}

export interface SynthesisResult {
  collections: TabCollection[];
  totalTabs: number;
  duplicateTabs: number;
  uniqueUrls: number;
  processingErrors: string[];
}

export class TabSynthesizer {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Parse OneTab backup files
  async parseOneTabBackup(fileContent: string, fileName: string): Promise<TabBackup> {
    this.log('info', `Parsing OneTab backup: ${fileName}`);
    
    const lines = fileContent.split('\n').filter(line => line.trim());
    const tabs: UnifiedTab[] = [];
    
    let currentIndex = 0;
    for (const line of lines) {
      if (line.includes('|')) {
        const [url, title] = line.split(' | ');
        if (url && title) {
          tabs.push({
            id: `onetab_${currentIndex}`,
            title: title.trim(),
            url: url.trim(),
            index: currentIndex,
            pinned: false,
            active: false,
            savedDate: new Date(), // OneTab doesn't include timestamps
            sourceBackup: fileName,
            sourceType: 'OneTab'
          });
          currentIndex++;
        }
      }
    }

    this.log('success', `OneTab backup parsed: ${tabs.length} tabs extracted`);
    
    return {
      id: `onetab_${Date.now()}`,
      source: fileName,
      type: 'onetab',
      name: `OneTab Backup - ${fileName}`,
      dateCreated: new Date(),
      tabCount: tabs.length,
      originalFormat: 'text',
      rawData: { tabs, originalContent: fileContent }
    };
  }

  // Parse Session Buddy backup files
  async parseSessionBuddyBackup(jsonContent: string, fileName: string): Promise<TabBackup> {
    this.log('info', `Parsing Session Buddy backup: ${fileName}`);
    
    try {
      const data = JSON.parse(jsonContent);
      const tabs: UnifiedTab[] = [];
      
      let tabIndex = 0;
      
      // Parse Session Buddy format - sessions contain windows with tabs
      if (data.sessions) {
        for (const session of data.sessions) {
          for (const window of session.windows || []) {
            for (const tab of window.tabs || []) {
              tabs.push({
                id: `sessionbuddy_${tabIndex}`,
                title: tab.title || 'Untitled',
                url: tab.url || '',
                favicon: tab.favIconUrl,
                windowId: window.id,
                index: tab.index || tabIndex,
                pinned: tab.pinned || false,
                active: tab.active || false,
                savedDate: new Date(session.dateCreated || Date.now()),
                sourceBackup: fileName,
                sourceType: 'Session Buddy'
              });
              tabIndex++;
            }
          }
        }
      }

      this.log('success', `Session Buddy backup parsed: ${tabs.length} tabs extracted`);
      
      return {
        id: `sessionbuddy_${Date.now()}`,
        source: fileName,
        type: 'session_buddy',
        name: `Session Buddy - ${fileName}`,
        dateCreated: new Date(),
        tabCount: tabs.length,
        originalFormat: 'json',
        rawData: { tabs, originalData: data }
      };
    } catch (error) {
      this.log('error', `Failed to parse Session Buddy backup: ${error}`);
      throw error;
    }
  }

  // Parse Tab Manager Plus backup files
  async parseTabManagerPlusBackup(jsonContent: string, fileName: string): Promise<TabBackup> {
    this.log('info', `Parsing Tab Manager Plus backup: ${fileName}`);
    
    try {
      const data = JSON.parse(jsonContent);
      const tabs: UnifiedTab[] = [];
      
      let tabIndex = 0;
      
      // Parse Tab Manager Plus format
      if (data.windows) {
        for (const window of data.windows) {
          for (const tab of window.tabs || []) {
            tabs.push({
              id: `tabmanager_${tabIndex}`,
              title: tab.title || 'Untitled',
              url: tab.url || '',
              favicon: tab.favIconUrl,
              windowId: window.id,
              groupName: tab.groupName,
              groupColor: tab.groupColor,
              index: tab.index || tabIndex,
              pinned: tab.pinned || false,
              active: tab.active || false,
              savedDate: new Date(data.dateCreated || Date.now()),
              sourceBackup: fileName,
              sourceType: 'Tab Manager Plus'
            });
            tabIndex++;
          }
        }
      }

      this.log('success', `Tab Manager Plus backup parsed: ${tabs.length} tabs extracted`);
      
      return {
        id: `tabmanager_${Date.now()}`,
        source: fileName,
        type: 'tab_manager_plus',
        name: `Tab Manager Plus - ${fileName}`,
        dateCreated: new Date(),
        tabCount: tabs.length,
        originalFormat: 'json',
        rawData: { tabs, originalData: data }
      };
    } catch (error) {
      this.log('error', `Failed to parse Tab Manager Plus backup: ${error}`);
      throw error;
    }
  }

  // Synthesize all tab backups into unified collections
  async synthesizeTabBackups(backups: TabBackup[]): Promise<SynthesisResult> {
    this.log('info', '═══ STARTING TAB SYNTHESIS ═══');
    this.log('info', `Processing ${backups.length} tab backup files`);
    
    const allTabs: UnifiedTab[] = [];
    const collections: TabCollection[] = [];
    const processingErrors: string[] = [];
    
    // Extract all tabs from backups
    for (const backup of backups) {
      try {
        const tabs = backup.rawData.tabs || [];
        allTabs.push(...tabs);
        
        // Create individual collection for each backup
        const collection: TabCollection = {
          id: `collection_${backup.id}`,
          name: backup.name,
          description: `${backup.type} backup with ${backup.tabCount} tabs`,
          tabs: tabs,
          createdDate: backup.dateCreated,
          modifiedDate: new Date(),
          sourceBackups: [backup.source],
          totalTabs: tabs.length,
          windowGroups: this.groupTabsByWindow(tabs)
        };
        
        collections.push(collection);
        this.log('success', `Processed ${backup.source}: ${tabs.length} tabs`);
      } catch (error) {
        const errorMsg = `Failed to process backup ${backup.source}: ${error}`;
        processingErrors.push(errorMsg);
        this.log('error', errorMsg);
      }
    }

    // Analyze duplicates
    const duplicateTabs = this.findDuplicateTabs(allTabs);
    const uniqueUrls = new Set(allTabs.map(tab => tab.url)).size;
    
    // Create unified collection
    if (collections.length > 1) {
      const unifiedCollection: TabCollection = {
        id: 'unified_collection',
        name: 'Unified Tab Collection',
        description: `Combined tabs from ${collections.length} sources`,
        tabs: allTabs,
        createdDate: new Date(),
        modifiedDate: new Date(),
        sourceBackups: backups.map(b => b.source),
        totalTabs: allTabs.length,
        windowGroups: this.groupTabsByWindow(allTabs)
      };
      collections.unshift(unifiedCollection);
    }

    this.log('success', '═══ TAB SYNTHESIS COMPLETE ═══');
    this.log('info', `Total tabs: ${allTabs.length} | Unique URLs: ${uniqueUrls} | Duplicates: ${duplicateTabs}`);
    
    return {
      collections,
      totalTabs: allTabs.length,
      duplicateTabs,
      uniqueUrls,
      processingErrors
    };
  }

  // Group tabs by window ID
  private groupTabsByWindow(tabs: UnifiedTab[]): Map<number, UnifiedTab[]> {
    const windowGroups = new Map<number, UnifiedTab[]>();
    
    for (const tab of tabs) {
      const windowId = tab.windowId || 0;
      if (!windowGroups.has(windowId)) {
        windowGroups.set(windowId, []);
      }
      windowGroups.get(windowId)!.push(tab);
    }
    
    return windowGroups;
  }

  // Find duplicate tabs based on URL
  private findDuplicateTabs(tabs: UnifiedTab[]): number {
    const urlCounts = new Map<string, number>();
    
    for (const tab of tabs) {
      const count = urlCounts.get(tab.url) || 0;
      urlCounts.set(tab.url, count + 1);
    }
    
    let duplicates = 0;
    for (const count of urlCounts.values()) {
      if (count > 1) {
        duplicates += count - 1;
      }
    }
    
    return duplicates;
  }

  // Export collection as bookmarks HTML
  exportAsBookmarks(collection: TabCollection): string {
    this.log('info', `Exporting ${collection.name} as bookmarks HTML`);
    
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!--This is an automatically generated file.
    It will be read and overwritten.
    Do Not Edit! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<Title>Bookmarks</Title>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 FOLDED ADD_DATE="${Math.floor(collection.createdDate.getTime() / 1000)}">${collection.name}</H3>
    <DL><p>`;

    // Group by window if available
    if (collection.windowGroups.size > 1) {
      for (const [windowId, tabs] of collection.windowGroups) {
        html += `
        <DT><H3 FOLDED>Window ${windowId}</H3>
        <DL><p>`;
        
        for (const tab of tabs) {
          const addDate = Math.floor(tab.savedDate.getTime() / 1000);
          html += `
            <DT><A HREF="${tab.url}" ADD_DATE="${addDate}">${tab.title}</A>`;
        }
        
        html += `
        </DL><p>`;
      }
    } else {
      // Single list of tabs
      for (const tab of collection.tabs) {
        const addDate = Math.floor(tab.savedDate.getTime() / 1000);
        html += `
        <DT><A HREF="${tab.url}" ADD_DATE="${addDate}">${tab.title}</A>`;
      }
    }

    html += `
    </DL><p>
</DL><p>`;

    this.log('success', `Bookmarks HTML exported: ${collection.tabs.length} tabs`);
    return html;
  }

  // Export collection as JSON
  exportAsJSON(collection: TabCollection): string {
    this.log('info', `Exporting ${collection.name} as JSON`);
    
    const exportData = {
      name: collection.name,
      description: collection.description,
      exportDate: new Date().toISOString(),
      totalTabs: collection.totalTabs,
      sourceBackups: collection.sourceBackups,
      tabs: collection.tabs.map(tab => ({
        title: tab.title,
        url: tab.url,
        favicon: tab.favicon,
        windowId: tab.windowId,
        groupName: tab.groupName,
        groupColor: tab.groupColor,
        index: tab.index,
        pinned: tab.pinned,
        savedDate: tab.savedDate.toISOString(),
        sourceType: tab.sourceType
      }))
    };

    this.log('success', `JSON exported: ${collection.tabs.length} tabs`);
    return JSON.stringify(exportData, null, 2);
  }

  // Export collection as CSV
  exportAsCSV(collection: TabCollection): string {
    this.log('info', `Exporting ${collection.name} as CSV`);
    
    const headers = ['Title', 'URL', 'Window ID', 'Group Name', 'Pinned', 'Saved Date', 'Source Type'];
    const rows = [headers.join(',')];
    
    for (const tab of collection.tabs) {
      const row = [
        `"${tab.title.replace(/"/g, '""')}"`,
        `"${tab.url}"`,
        tab.windowId || '',
        `"${tab.groupName || ''}"`,
        tab.pinned ? 'Yes' : 'No',
        tab.savedDate.toISOString(),
        `"${tab.sourceType}"`
      ];
      rows.push(row.join(','));
    }

    this.log('success', `CSV exported: ${collection.tabs.length} tabs`);
    return rows.join('\n');
  }
}