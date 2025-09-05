import { 
  BrowserProfile, 
  BrowserType, 
  DataSourceType, 
  ExtensionBackup, 
  ExtensionBackupFormat, 
  DiscoveryResult,
  SourceValidationResult
} from '../types/types';

/**
 * Phase 1: Multi-Source Reconnaissance Service
 * Scans user-specified directories to identify and catalogue all valuable data sources:
 * - Complete Firefox Profiles (places.sqlite, prefs.js)
 * - Chrome/Chromium-based Profiles (Bookmarks, Login Data, History)  
 * - Extension Backups (OneTab, Session Buddy, etc.)
 */
export class MultiSourceReconnaissanceService {
  
  /**
   * Main entry point for comprehensive data source discovery
   */
  async discoverAllDataSources(): Promise<DiscoveryResult> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported. Please use Chrome 86+ or Edge 86+.');
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const scanPath = dirHandle.name || 'Selected Directory';
      
      console.log(`🔍 Starting Multi-Source Reconnaissance on: ${scanPath}`);
      
      const browserProfiles: BrowserProfile[] = [];
      const extensionBackups: ExtensionBackup[] = [];
      
      // Recursively scan the directory for all data sources
      await this.scanDirectoryRecursively(dirHandle, browserProfiles, extensionBackups);
      
      const result: DiscoveryResult = {
        browserProfiles,
        extensionBackups,
        totalSources: browserProfiles.length + extensionBackups.length,
        scanPath,
        timestamp: new Date()
      };

      console.log(`✅ Scan complete. Found:`, this.generateDiscoveryReport(result));
      return result;
      
    } catch (error) {
      console.error('Multi-source discovery failed:', error);
      throw new Error('Failed to scan directory. Please check permissions and try again.');
    }
  }

  /**
   * Recursively scan directory structure for all data sources
   */
  private async scanDirectoryRecursively(
    dirHandle: any, 
    browserProfiles: BrowserProfile[], 
    extensionBackups: ExtensionBackup[]
  ): Promise<void> {
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'directory') {
          // Check if this directory is a browser profile
          const browserType = await this.identifyBrowserProfile(handle, name);
          if (browserType) {
            const profile = await this.createBrowserProfile(handle, name, browserType);
            if (profile) {
              browserProfiles.push(profile);
            }
          }
          
          // Recursively scan subdirectories
          await this.scanDirectoryRecursively(handle, browserProfiles, extensionBackups);
          
        } else if (handle.kind === 'file') {
          // Check if this file is an extension backup
          const backupFormat = this.identifyExtensionBackup(name);
          if (backupFormat !== ExtensionBackupFormat.UNKNOWN) {
            const backup = await this.createExtensionBackup(handle, name, backupFormat);
            if (backup) {
              extensionBackups.push(backup);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
    }
  }

  /**
   * Identify if a directory contains a browser profile and determine browser type
   */
  private async identifyBrowserProfile(dirHandle: any, name: string): Promise<BrowserType | null> {
    try {
      const fileList: string[] = [];
      const dirList: string[] = [];
      
      for await (const [fileName, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          fileList.push(fileName);
        } else if (handle.kind === 'directory') {
          dirList.push(fileName);
        }
      }

      // Firefox Profile Detection
      if (this.isFirefoxProfile(fileList, dirList)) {
        return BrowserType.FIREFOX;
      }

      // Chrome Profile Detection
      if (this.isChromeProfile(fileList, dirList, name)) {
        return BrowserType.CHROME;
      }

      // Edge Profile Detection  
      if (this.isEdgeProfile(fileList, dirList, name)) {
        return BrowserType.EDGE;
      }

      // Brave Profile Detection
      if (this.isBraveProfile(fileList, dirList, name)) {
        return BrowserType.BRAVE;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Firefox Profile Detection Logic
   */
  private isFirefoxProfile(files: string[], dirs: string[]): boolean {
    const firefoxRequiredFiles = ['prefs.js'];
    const firefoxOptionalFiles = ['places.sqlite', 'cookies.sqlite', 'addons.json', 'extensions.json'];
    const firefoxDirs = ['extensions', 'storage'];

    const hasRequired = firefoxRequiredFiles.some(file => files.includes(file));
    const hasOptional = firefoxOptionalFiles.some(file => files.includes(file));
    const hasFirefoxDirs = firefoxDirs.some(dir => dirs.includes(dir));

    return hasRequired || (hasOptional && hasFirefoxDirs);
  }

  /**
   * Chrome Profile Detection Logic
   */
  private isChromeProfile(files: string[], dirs: string[], name: string): boolean {
    const chromeFiles = ['Bookmarks', 'Login Data', 'History', 'Preferences'];
    const chromeDirs = ['Extensions', 'Local Storage'];
    
    const hasChromeFiles = chromeFiles.some(file => files.includes(file));
    const hasChromeDirs = chromeDirs.some(dir => dirs.includes(dir));
    const hasDefaultPattern = name.toLowerCase().includes('default') || Boolean(name.match(/^profile\s*\d*$/i));

    return (hasChromeFiles || hasChromeDirs) && hasDefaultPattern;
  }

  /**
   * Edge Profile Detection Logic
   */
  private isEdgeProfile(files: string[], dirs: string[], name: string): boolean {
    const edgeFiles = ['Bookmarks', 'Login Data', 'History', 'Preferences'];
    const edgeDirs = ['Extensions', 'Local Storage'];
    
    const hasEdgeFiles = edgeFiles.some(file => files.includes(file));
    const hasEdgeDirs = edgeDirs.some(dir => dirs.includes(dir));
    const isEdgeProfile = name.toLowerCase().includes('edge') || 
                         files.some(f => f.includes('msedge'));

    return (hasEdgeFiles || hasEdgeDirs) && isEdgeProfile;
  }

  /**
   * Brave Profile Detection Logic
   */
  private isBraveProfile(files: string[], dirs: string[], name: string): boolean {
    const braveFiles = ['Bookmarks', 'Login Data', 'History', 'Preferences'];
    const braveDirs = ['Extensions', 'Local Storage'];
    
    const hasBraveFiles = braveFiles.some(file => files.includes(file));
    const hasBraveDirs = braveDirs.some(dir => dirs.includes(dir));
    const isBraveProfile = name.toLowerCase().includes('brave') || 
                          files.some(f => f.includes('brave'));

    return (hasBraveFiles || hasBraveDirs) && isBraveProfile;
  }

  /**
   * Identify extension backup format from filename
   */
  private identifyExtensionBackup(fileName: string): ExtensionBackupFormat {
    const nameLower = fileName.toLowerCase();
    
    // OneTab exports
    if (nameLower.includes('onetab') || nameLower.includes('one-tab')) {
      if (fileName.endsWith('.json')) return ExtensionBackupFormat.ONETAB_JSON;
      if (fileName.endsWith('.txt')) return ExtensionBackupFormat.ONETAB_TEXT;
      return ExtensionBackupFormat.ONETAB_TEXT; // Default assumption
    }

    // Session Buddy exports
    if (nameLower.includes('session') && (nameLower.includes('buddy') || nameLower.includes('save'))) {
      return ExtensionBackupFormat.SESSION_BUDDY;
    }

    // TabManager Plus exports
    if (nameLower.includes('tabmanager') || nameLower.includes('tab-manager')) {
      return ExtensionBackupFormat.TABMANAGER_PLUS;
    }

    // Generic JSON files that might contain tabs
    if (fileName.endsWith('.json') && (
      nameLower.includes('tab') || 
      nameLower.includes('bookmark') || 
      nameLower.includes('session')
    )) {
      return ExtensionBackupFormat.GENERIC_JSON;
    }

    return ExtensionBackupFormat.UNKNOWN;
  }

  /**
   * Create BrowserProfile object from directory handle
   */
  private async createBrowserProfile(
    dirHandle: any, 
    name: string, 
    browserType: BrowserType
  ): Promise<BrowserProfile | null> {
    try {
      const validation = await this.validateBrowserProfile(dirHandle, browserType);
      
      const profile: BrowserProfile = {
        id: this.generateId(),
        name,
        path: `/${name}`,
        size: await this.calculateDirectorySize(dirHandle),
        lastModified: new Date(),
        browserType,
        browserVersion: await this.getBrowserVersion(dirHandle, browserType),
        profileType: this.determineProfileType(name, browserType),
        validation,
        handle: dirHandle
      };

      return profile;
    } catch (error) {
      console.error(`Error creating browser profile from ${name}:`, error);
      return null;
    }
  }

  /**
   * Create ExtensionBackup object from file handle
   */
  private async createExtensionBackup(
    fileHandle: any, 
    fileName: string, 
    format: ExtensionBackupFormat
  ): Promise<ExtensionBackup | null> {
    try {
      const file = await fileHandle.getFile();
      const validation = await this.validateExtensionBackup(file, format);
      
      const backup: ExtensionBackup = {
        id: this.generateId(),
        name: fileName,
        path: `/${fileName}`,
        type: DataSourceType.EXTENSION_BACKUP,
        size: file.size,
        lastModified: new Date(file.lastModified),
        validation,
        format,
        extensionName: this.extractExtensionName(fileName),
        tabCount: await this.estimateTabCount(file, format)
      };

      return backup;
    } catch (error) {
      console.error(`Error creating extension backup from ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Validate browser profile based on type
   */
  private async validateBrowserProfile(
    dirHandle: any, 
    browserType: BrowserType
  ): Promise<SourceValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let confidence = 0.8; // Base confidence

    try {
      const fileList: string[] = [];
      
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          fileList.push(name);
        }
      }

      switch (browserType) {
        case BrowserType.FIREFOX:
          if (!fileList.includes('prefs.js')) {
            issues.push('Missing Firefox preferences file (prefs.js)');
            confidence -= 0.3;
          }
          if (!fileList.includes('places.sqlite')) {
            warnings.push('Missing bookmarks/history database (places.sqlite)');
            confidence -= 0.1;
          }
          if (fileList.includes('parent.lock')) {
            warnings.push('Profile may be in use (Firefox running)');
          }
          break;

        case BrowserType.CHROME:
        case BrowserType.EDGE:  
        case BrowserType.BRAVE:
          if (!fileList.includes('Bookmarks')) {
            issues.push('Missing bookmarks file');
            confidence -= 0.2;
          }
          if (!fileList.includes('Preferences')) {
            warnings.push('Missing preferences file');
            confidence -= 0.1;
          }
          break;
      }

    } catch (error) {
      issues.push('Unable to validate profile structure');
      confidence = 0.3;
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  /**
   * Validate extension backup file
   */
  private async validateExtensionBackup(
    file: File, 
    format: ExtensionBackupFormat
  ): Promise<SourceValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let confidence = 0.7;

    try {
      if (file.size === 0) {
        issues.push('File is empty');
        confidence = 0;
      } else if (file.size > 50 * 1024 * 1024) { // 50MB
        warnings.push('Unusually large backup file');
      }

      // Quick format validation
      if (format === ExtensionBackupFormat.GENERIC_JSON) {
        try {
          const text = await file.text();
          JSON.parse(text.substring(0, 1000)); // Parse first 1KB
          confidence += 0.2;
        } catch {
          issues.push('Invalid JSON format');
          confidence -= 0.4;
        }
      }

    } catch (error) {
      issues.push('Unable to read backup file');
      confidence = 0.2;
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  /**
   * Calculate total directory size
   */
  private async calculateDirectorySize(dirHandle: any): Promise<number> {
    let totalSize = 0;
    
    try {
      for await (const [, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            totalSize += file.size;
          } catch (error) {
            // Skip inaccessible files
          }
        } else if (handle.kind === 'directory') {
          totalSize += await this.calculateDirectorySize(handle);
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error);
    }
    
    return totalSize;
  }

  /**
   * Get browser version from profile data
   */
  private async getBrowserVersion(dirHandle: any, browserType: BrowserType): Promise<string | undefined> {
    try {
      switch (browserType) {
        case BrowserType.FIREFOX:
          const compatHandle = await dirHandle.getFileHandle('compatibility.ini');
          const compatFile = await compatHandle.getFile();
          const compatContent = await compatFile.text();
          const versionMatch = compatContent.match(/MinVersion=(\d+\.\d+)/);
          return versionMatch ? versionMatch[1] : undefined;

        case BrowserType.CHROME:
        case BrowserType.EDGE:
        case BrowserType.BRAVE:
          const prefHandle = await dirHandle.getFileHandle('Preferences');
          const prefFile = await prefHandle.getFile();
          const prefContent = await prefFile.text();
          const prefData = JSON.parse(prefContent);
          return prefData?.profile?.version || undefined;
      }
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Determine profile type/category
   */
  private determineProfileType(name: string, browserType: BrowserType): string {
    const nameLower = name.toLowerCase();
    
    switch (browserType) {
      case BrowserType.FIREFOX:
        if (nameLower.includes('default')) {
          if (nameLower.includes('release')) return 'default-release';
          if (nameLower.includes('esr')) return 'default-esr';
          return 'default';
        } else if (nameLower.includes('dev')) {
          return 'developer';
        } else if (nameLower.includes('nightly')) {
          return 'nightly';
        }
        return 'custom';

      case BrowserType.CHROME:
      case BrowserType.EDGE:
      case BrowserType.BRAVE:
        if (nameLower.includes('default') || nameLower === 'profile 1') {
          return 'default';
        } else if (nameLower.match(/profile\s*\d+/)) {
          return 'additional';
        }
        return 'custom';

      default:
        return 'unknown';
    }
  }

  /**
   * Extract extension name from backup filename
   */
  private extractExtensionName(fileName: string): string | undefined {
    const nameLower = fileName.toLowerCase();
    
    if (nameLower.includes('onetab')) return 'OneTab';
    if (nameLower.includes('session') && nameLower.includes('buddy')) return 'Session Buddy';
    if (nameLower.includes('tabmanager')) return 'Tab Manager Plus';
    
    return undefined;
  }

  /**
   * Estimate number of tabs in backup file
   */
  private async estimateTabCount(file: File, format: ExtensionBackupFormat): Promise<number | undefined> {
    try {
      const text = await file.text();
      
      switch (format) {
        case ExtensionBackupFormat.ONETAB_TEXT:
          return text.split('\n').filter(line => line.trim().startsWith('http')).length;
        
        case ExtensionBackupFormat.ONETAB_JSON:
        case ExtensionBackupFormat.SESSION_BUDDY:
        case ExtensionBackupFormat.GENERIC_JSON:
          const data = JSON.parse(text);
          if (Array.isArray(data)) return data.length;
          if (data.tabs) return Array.isArray(data.tabs) ? data.tabs.length : 0;
          if (data.windows) {
            return Object.values(data.windows).reduce((count: number, window: any) => {
              return count + (window.tabs ? window.tabs.length : 0);
            }, 0);
          }
          break;
      }
      
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Generate human-readable discovery report
   */
  private generateDiscoveryReport(result: DiscoveryResult): string {
    const firefoxProfiles = result.browserProfiles.filter(p => p.browserType === BrowserType.FIREFOX);
    const chromeProfiles = result.browserProfiles.filter(p => p.browserType === BrowserType.CHROME);
    const edgeProfiles = result.browserProfiles.filter(p => p.browserType === BrowserType.EDGE);
    const braveProfiles = result.browserProfiles.filter(p => p.browserType === BrowserType.BRAVE);
    
    const parts = [];
    if (firefoxProfiles.length) parts.push(`${firefoxProfiles.length} Firefox profiles`);
    if (chromeProfiles.length) parts.push(`${chromeProfiles.length} Chrome profiles`);  
    if (edgeProfiles.length) parts.push(`${edgeProfiles.length} Edge profiles`);
    if (braveProfiles.length) parts.push(`${braveProfiles.length} Brave profiles`);
    if (result.extensionBackups.length) parts.push(`${result.extensionBackups.length} extension backup files`);
    
    return parts.length ? parts.join(', ') + '. Ready to assimilate.' : 'No data sources found.';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Legacy class name for backward compatibility
export const ProfileDiscoveryService = MultiSourceReconnaissanceService;