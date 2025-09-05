// Real File System Access - Replace mock data with actual browser profile discovery
// Uses File System Access API with fallbacks for production use

export interface FileSystemHandle {
  name: string;
  kind: 'file' | 'directory';
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirectoryEntry[];
}

export class RealFileSystemAccess {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Check if File System Access API is supported
  isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  // Request user to select browser profiles directory
  async selectBrowserProfilesDirectory(): Promise<DirectoryEntry | null> {
    this.log('info', 'Requesting browser profiles directory selection...');
    
    if (!this.isFileSystemAccessSupported()) {
      this.log('error', 'File System Access API not supported in this browser');
      throw new Error('File System Access API not supported. Please use Chrome 86+ or Edge 86+.');
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'desktop'
      });
      
      this.log('success', `Selected directory: ${dirHandle.name}`);
      return await this.processDirectoryHandle(dirHandle);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.log('warning', 'Directory selection cancelled by user');
        return null;
      }
      this.log('error', `Directory selection failed: ${error.message}`);
      throw error;
    }
  }

  // Process directory handle and build file tree
  private async processDirectoryHandle(dirHandle: any, path = ''): Promise<DirectoryEntry> {
    const entry: DirectoryEntry = {
      name: dirHandle.name,
      path: path + dirHandle.name,
      isDirectory: true,
      children: []
    };

    try {
      for await (const [_name, handle] of dirHandle.entries()) {
        if (handle.kind === 'directory') {
          // Recursively process subdirectories (with depth limit)
          if (path.split('/').length < 5) { // Max depth 5
            const subDir = await this.processDirectoryHandle(handle, `${entry.path}/`);
            entry.children!.push(subDir);
          } else {
            entry.children!.push({
              name: handle.name,
              path: `${entry.path}/${handle.name}`,
              isDirectory: true
            });
          }
        } else {
          // Add file entries
          entry.children!.push({
            name: handle.name,
            path: `${entry.path}/${handle.name}`,
            isDirectory: false
          });
        }
      }
    } catch (error) {
      this.log('warning', `Could not read some files in ${entry.name}: ${error}`);
    }

    return entry;
  }

  // Find browser profile directories within selected folder
  async findBrowserProfiles(rootDir: DirectoryEntry): Promise<{
    firefox: DirectoryEntry[];
    chrome: DirectoryEntry[];
    edge: DirectoryEntry[];
    brave: DirectoryEntry[];
  }> {
    this.log('info', 'Scanning for browser profile directories...');
    
    const profiles = {
      firefox: [] as DirectoryEntry[],
      chrome: [] as DirectoryEntry[],
      edge: [] as DirectoryEntry[],
      brave: [] as DirectoryEntry[]
    };

    await this.scanForProfiles(rootDir, profiles);
    
    this.log('success', `Found ${profiles.firefox.length} Firefox, ${profiles.chrome.length} Chrome, ${profiles.edge.length} Edge, ${profiles.brave.length} Brave profiles`);
    
    return profiles;
  }

  // Recursively scan directory tree for browser profiles
  private async scanForProfiles(dir: DirectoryEntry, profiles: any, depth = 0): Promise<void> {
    if (depth > 6 || !dir.children) return; // Limit recursion depth

    for (const item of dir.children) {
      if (!item.isDirectory) continue;

      // Firefox profile detection
      if (this.isFirefoxProfile(item)) {
        profiles.firefox.push(item);
        this.log('info', `Found Firefox profile: ${item.name}`);
      }
      
      // Chrome profile detection
      else if (this.isChromeProfile(item)) {
        profiles.chrome.push(item);
        this.log('info', `Found Chrome profile: ${item.name}`);
      }
      
      // Edge profile detection
      else if (this.isEdgeProfile(item)) {
        profiles.edge.push(item);
        this.log('info', `Found Edge profile: ${item.name}`);
      }
      
      // Brave profile detection
      else if (this.isBraveProfile(item)) {
        profiles.brave.push(item);
        this.log('info', `Found Brave profile: ${item.name}`);
      }
      
      // Recurse into subdirectories
      else {
        await this.scanForProfiles(item, profiles, depth + 1);
      }
    }
  }

  // Detect Firefox profile by signature files
  private isFirefoxProfile(dir: DirectoryEntry): boolean {
    if (!dir.children) return false;
    
    const hasPlacesDB = dir.children.some(f => f.name === 'places.sqlite');
    const hasPrefs = dir.children.some(f => f.name === 'prefs.js');
    const hasCompatINI = dir.children.some(f => f.name === 'compatibility.ini');
    
    return hasPlacesDB && hasPrefs && hasCompatINI;
  }

  // Detect Chrome profile by signature files
  private isChromeProfile(dir: DirectoryEntry): boolean {
    if (!dir.children) return false;
    
    const hasBookmarks = dir.children.some(f => f.name === 'Bookmarks');
    const hasHistory = dir.children.some(f => f.name === 'History');
    const hasPrefs = dir.children.some(f => f.name === 'Preferences');
    
    return hasBookmarks && hasHistory && hasPrefs;
  }

  // Detect Edge profile by signature files
  private isEdgeProfile(dir: DirectoryEntry): boolean {
    if (!dir.children) return false;
    
    // Edge uses same structure as Chrome but in different location
    const hasBookmarks = dir.children.some(f => f.name === 'Bookmarks');
    const hasHistory = dir.children.some(f => f.name === 'History');
    const hasPrefs = dir.children.some(f => f.name === 'Preferences');
    
    // Check if path suggests Edge
    const pathSuggetsEdge = dir.path.toLowerCase().includes('edge') || 
                           dir.path.toLowerCase().includes('msedge') ||
                           dir.path.toLowerCase().includes('microsoft');
    
    return hasBookmarks && hasHistory && hasPrefs && pathSuggetsEdge;
  }

  // Detect Brave profile by signature files
  private isBraveProfile(dir: DirectoryEntry): boolean {
    if (!dir.children) return false;
    
    // Brave uses Chrome structure but in Brave directory
    const hasBookmarks = dir.children.some(f => f.name === 'Bookmarks');
    const hasHistory = dir.children.some(f => f.name === 'History');
    const hasPrefs = dir.children.some(f => f.name === 'Preferences');
    
    const pathSuggestsBrave = dir.path.toLowerCase().includes('brave');
    
    return hasBookmarks && hasHistory && hasPrefs && pathSuggestsBrave;
  }

  // Read file content using File System Access API
  async readFile(filePath: string, dirHandle: any): Promise<string | ArrayBuffer> {
    this.log('info', `Reading file: ${filePath}`);
    
    try {
      const pathParts = filePath.split('/').filter(p => p);
      let currentHandle = dirHandle;
      
      // Navigate to the file through directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
      }
      
      const fileHandle = await currentHandle.getFileHandle(pathParts[pathParts.length - 1]);
      const file = await fileHandle.getFile();
      
      // Return as ArrayBuffer for binary files (SQLite), text for others
      if (filePath.endsWith('.sqlite') || filePath.endsWith('.db')) {
        return await file.arrayBuffer();
      } else {
        return await file.text();
      }
    } catch (error) {
      this.log('error', `Failed to read file ${filePath}: ${error}`);
      throw error;
    }
  }

  // Get file handle for direct access
  async getFileHandle(filePath: string, dirHandle: any): Promise<any> {
    const pathParts = filePath.split('/').filter(p => p);
    let currentHandle = dirHandle;
    
    // Navigate to the file
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
    }
    
    return await currentHandle.getFileHandle(pathParts[pathParts.length - 1]);
  }

  // Create backup directory
  async createBackupDirectory(parentHandle: any, backupName: string): Promise<any> {
    this.log('info', `Creating backup directory: ${backupName}`);
    
    try {
      return await parentHandle.getDirectoryHandle(backupName, { create: true });
    } catch (error) {
      this.log('error', `Failed to create backup directory: ${error}`);
      throw error;
    }
  }

  // Copy file to backup location
  async copyFileToBackup(sourceHandle: any, backupDirHandle: any, fileName: string): Promise<void> {
    this.log('info', `Backing up file: ${fileName}`);
    
    try {
      const sourceFile = await sourceHandle.getFile();
      const backupFileHandle = await backupDirHandle.getFileHandle(fileName, { create: true });
      const writable = await backupFileHandle.createWritable();
      
      await writable.write(sourceFile);
      await writable.close();
      
      this.log('success', `File backed up: ${fileName}`);
    } catch (error) {
      this.log('error', `Failed to backup file ${fileName}: ${error}`);
      throw error;
    }
  }
}