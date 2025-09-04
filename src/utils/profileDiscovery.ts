import { FirefoxProfile } from '../types/types';

export class ProfileDiscoveryService {
  private getDefaultProfilePaths(): string[] {
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('mac')) {
      return [
        '~/Library/Application Support/Firefox/Profiles',
        '~/Library/Application Support/Firefox'
      ];
    } else if (platform.includes('win')) {
      return [
        '%APPDATA%\\Mozilla\\Firefox\\Profiles',
        '%APPDATA%\\Mozilla\\Firefox'
      ];
    } else {
      return [
        '~/.mozilla/firefox',
        '~/.firefox'
      ];
    }
  }

  async discoverProfiles(customPath?: string): Promise<FirefoxProfile[]> {
    try {
      // In a real implementation, this would use the File System Access API
      // or a native bridge to scan the file system
      const profiles = await this.scanForProfiles(customPath);
      return profiles.filter(profile => this.validateProfile(profile));
    } catch (error) {
      console.error('Profile discovery failed:', error);
      throw new Error('Failed to discover Firefox profiles. Please check permissions and try again.');
    }
  }

  private async scanForProfiles(customPath?: string): Promise<FirefoxProfile[]> {
    const profiles: FirefoxProfile[] = [];
    
    // This would be implemented using File System Access API in a real browser environment
    // For now, we'll simulate the discovery process
    
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const foundProfiles = await this.scanDirectory(dirHandle);
        profiles.push(...foundProfiles);
      } catch (error) {
        console.error('Directory access denied or cancelled:', error);
      }
    } else {
      throw new Error('File System Access API not supported. Please use a modern browser like Chrome or Edge.');
    }
    
    return profiles;
  }

  private async scanDirectory(dirHandle: any): Promise<FirefoxProfile[]> {
    const profiles: FirefoxProfile[] = [];
    
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'directory') {
          // Check if this directory contains Firefox profile files
          const isProfile = await this.isFirefoxProfile(handle);
          if (isProfile) {
            const profile = await this.createProfileFromHandle(handle, name);
            if (profile) {
              profiles.push(profile);
            }
          }
          
          // Recursively scan subdirectories
          const subProfiles = await this.scanDirectory(handle);
          profiles.push(...subProfiles);
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
    }
    
    return profiles;
  }

  private async isFirefoxProfile(dirHandle: any): Promise<boolean> {
    try {
      // Check for key Firefox profile files
      const requiredFiles = ['prefs.js'];
      const optionalFiles = ['places.sqlite', 'cookies.sqlite', 'addons.json'];
      
      let hasRequired = false;
      let hasOptional = false;
      
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          if (requiredFiles.includes(name)) {
            hasRequired = true;
          }
          if (optionalFiles.includes(name)) {
            hasOptional = true;
          }
        }
      }
      
      return hasRequired || hasOptional;
    } catch (error) {
      return false;
    }
  }

  private async createProfileFromHandle(dirHandle: any, name: string): Promise<FirefoxProfile | null> {
    try {
      const profile: FirefoxProfile = {
        id: this.generateId(),
        name: name,
        path: `/${name}`, // Simplified path for web environment
        size: await this.calculateDirectorySize(dirHandle),
        lastModified: new Date(), // Would get actual modification time in real implementation
        firefoxVersion: await this.getFirefoxVersion(dirHandle),
        profileType: this.determineProfileType(name),
        validation: await this.validateProfileHandle(dirHandle)
      };
      
      return profile;
    } catch (error) {
      console.error(`Error creating profile from ${name}:`, error);
      return null;
    }
  }

  private async calculateDirectorySize(dirHandle: any): Promise<number> {
    let totalSize = 0;
    
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            totalSize += file.size;
          } catch (error) {
            // Skip files we can't access
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

  private async getFirefoxVersion(dirHandle: any): Promise<string | undefined> {
    try {
      const compatHandle = await dirHandle.getFileHandle('compatibility.ini');
      const file = await compatHandle.getFile();
      const content = await file.text();
      
      const versionMatch = content.match(/MinVersion=(\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : undefined;
    } catch (error) {
      return undefined;
    }
  }

  private determineProfileType(name: string): string {
    const nameLower = name.toLowerCase();
    
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
  }

  private async validateProfileHandle(dirHandle: any): Promise<{ isValid: boolean; issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Check for required files
      const requiredFiles = ['prefs.js'];
      const foundFiles: string[] = [];
      
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          foundFiles.push(name);
        }
      }
      
      // Check for missing required files
      for (const required of requiredFiles) {
        if (!foundFiles.includes(required)) {
          issues.push(`Missing critical file: ${required}`);
        }
      }
      
      // Check for lock files
      if (foundFiles.includes('parent.lock')) {
        warnings.push('Profile is locked (Firefox may be running)');
      }
      
      // Check for common profile files
      const profileFiles = ['places.sqlite', 'cookies.sqlite', 'addons.json'];
      const hasProfileFiles = profileFiles.some(file => foundFiles.includes(file));
      
      if (!hasProfileFiles && issues.length === 0) {
        warnings.push('Profile appears to be empty or incomplete');
      }
      
    } catch (error) {
      issues.push('Unable to validate profile structure');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  private validateProfile(profile: FirefoxProfile): boolean {
    return profile.validation.isValid;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}