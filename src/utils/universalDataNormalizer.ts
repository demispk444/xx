// Universal Data Normalizer - Converts all browser data into unified intermediate format
// Reliability-first: Creates staging area for safe rollback

import { BrowserType } from '../types/types';

export interface UniversalBookmark {
  id: string;
  title: string;
  url: string;
  folder: string[];
  dateAdded: Date;
  dateModified?: Date;
  sourceProfile: string;
  sourceBrowser: BrowserType;
  tags: string[];
  description?: string;
  favicon?: string;
  visitCount?: number;
}

export interface UniversalHistoryEntry {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisit: Date;
  firstVisit: Date;
  sourceProfile: string;
  sourceBrowser: BrowserType;
  duration?: number;
  referrer?: string;
  searchTerm?: string;
}

export interface UniversalLogin {
  id: string;
  url: string;
  domain: string;
  username: string;
  passwordHash: string;
  dateCreated: Date;
  dateLastUsed: Date;
  datePasswordChanged?: Date;
  sourceProfile: string;
  sourceBrowser: BrowserType;
  formSubmitUrl?: string;
  usernameField?: string;
  passwordField?: string;
  timesUsed: number;
}

export interface UniversalCookie {
  id: string;
  domain: string;
  name: string;
  value: string;
  path: string;
  expiresUtc?: Date;
  isSecure: boolean;
  isHttpOnly: boolean;
  sameSite: 'None' | 'Lax' | 'Strict';
  sourceProfile: string;
  sourceBrowser: BrowserType;
  dateCreated: Date;
  lastAccessed: Date;
}

export interface UniversalExtension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
  storeUrl: string;
  homepage?: string;
  permissions: string[];
  installDate: Date;
  updateDate?: Date;
  sourceProfile: string;
  sourceBrowser: BrowserType;
  manifestData: any;
  extensionId: string;
}

export interface UniversalTab {
  id: string;
  title: string;
  url: string;
  windowId: number;
  index: number;
  active: boolean;
  pinned: boolean;
  groupName?: string;
  groupColor?: string;
  sourceBackup: string;
  sourceExtension: string;
  savedDate: Date;
  favicon?: string;
}

export interface NormalizedDataSet {
  bookmarks: UniversalBookmark[];
  history: UniversalHistoryEntry[];
  logins: UniversalLogin[];
  cookies: UniversalCookie[];
  extensions: UniversalExtension[];
  tabs: UniversalTab[];
  metadata: {
    extractionDate: Date;
    totalRecords: number;
    sourceProfiles: string[];
    version: string;
  };
}

export class UniversalDataNormalizer {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Normalize Firefox bookmarks from places.sqlite
  normalizeFirefoxBookmarks(firefoxBookmarks: any[], profilePath: string): UniversalBookmark[] {
    this.log('info', `Normalizing ${firefoxBookmarks.length} Firefox bookmarks`);
    
    return firefoxBookmarks.map((bookmark, index) => ({
      id: `ff_bm_${bookmark.id || index}`,
      title: bookmark.title || 'Untitled',
      url: bookmark.url || '',
      folder: this.parseFirefoxFolderPath(bookmark.parent_folder || 'Bookmarks'),
      dateAdded: new Date(bookmark.dateAdded || Date.now()),
      dateModified: bookmark.lastModified ? new Date(bookmark.lastModified) : undefined,
      sourceProfile: profilePath,
      sourceBrowser: BrowserType.FIREFOX,
      tags: bookmark.tags ? bookmark.tags.split(',').map((t: string) => t.trim()) : [],
      description: bookmark.description,
      favicon: bookmark.favicon,
      visitCount: bookmark.visit_count || 0
    }));
  }

  // Normalize Chrome bookmarks from Bookmarks JSON
  normalizeChromeBookmarks(chromeBookmarks: any[], profilePath: string, browserType: BrowserType): UniversalBookmark[] {
    this.log('info', `Normalizing ${chromeBookmarks.length} Chrome bookmarks`);
    
    return chromeBookmarks.map((bookmark, index) => ({
      id: `chr_bm_${bookmark.id || index}`,
      title: bookmark.name || 'Untitled',
      url: bookmark.url || '',
      folder: this.parseChromeFolderPath(bookmark.folder || 'Bookmarks Bar'),
      dateAdded: new Date(parseInt(bookmark.date_added) / 1000) || new Date(),
      dateModified: bookmark.date_modified ? new Date(parseInt(bookmark.date_modified) / 1000) : undefined,
      sourceProfile: profilePath,
      sourceBrowser: browserType,
      tags: [],
      description: bookmark.meta_info?.description,
      favicon: bookmark.meta_info?.favicon,
      visitCount: 0
    }));
  }

  // Normalize Firefox history from places.sqlite
  normalizeFirefoxHistory(firefoxHistory: any[], profilePath: string): UniversalHistoryEntry[] {
    this.log('info', `Normalizing ${firefoxHistory.length} Firefox history entries`);
    
    return firefoxHistory.map((entry, index) => ({
      id: `ff_hist_${entry.id || index}`,
      url: entry.url || '',
      title: entry.title || 'Untitled',
      visitCount: entry.visit_count || 1,
      lastVisit: new Date(entry.last_visit_date || Date.now()),
      firstVisit: new Date(entry.first_visit_date || entry.last_visit_date || Date.now()),
      sourceProfile: profilePath,
      sourceBrowser: BrowserType.FIREFOX,
      duration: entry.visit_duration,
      referrer: entry.referrer,
      searchTerm: this.extractSearchTerm(entry.url)
    }));
  }

  // Normalize Chrome history from History SQLite
  normalizeChromeHistory(chromeHistory: any[], profilePath: string, browserType: BrowserType): UniversalHistoryEntry[] {
    this.log('info', `Normalizing ${chromeHistory.length} Chrome history entries`);
    
    return chromeHistory.map((entry, index) => ({
      id: `chr_hist_${entry.id || index}`,
      url: entry.url || '',
      title: entry.title || 'Untitled',
      visitCount: entry.visit_count || 1,
      lastVisit: new Date(parseInt(entry.last_visit_time) / 1000) || new Date(),
      firstVisit: new Date(parseInt(entry.first_visit_time) / 1000) || new Date(),
      sourceProfile: profilePath,
      sourceBrowser: browserType,
      duration: entry.visit_duration,
      searchTerm: this.extractSearchTerm(entry.url)
    }));
  }

  // Normalize Firefox logins from logins.json + key4.db
  normalizeFirefoxLogins(firefoxLogins: any[], profilePath: string): UniversalLogin[] {
    this.log('info', `Normalizing ${firefoxLogins.length} Firefox login entries`);
    
    return firefoxLogins.map((login, index) => ({
      id: `ff_login_${login.id || index}`,
      url: login.hostname || '',
      domain: this.extractDomain(login.hostname || ''),
      username: login.encryptedUsername || '',
      passwordHash: login.encryptedPassword || '[ENCRYPTED]',
      dateCreated: new Date(login.timeCreated || Date.now()),
      dateLastUsed: new Date(login.timeLastUsed || Date.now()),
      datePasswordChanged: login.timePasswordChanged ? new Date(login.timePasswordChanged) : undefined,
      sourceProfile: profilePath,
      sourceBrowser: BrowserType.FIREFOX,
      formSubmitUrl: login.formSubmitURL,
      usernameField: login.usernameField,
      passwordField: login.passwordField,
      timesUsed: login.timesUsed || 1
    }));
  }

  // Normalize Chrome logins from Login Data SQLite
  normalizeChromeLogins(chromeLogins: any[], profilePath: string, browserType: BrowserType): UniversalLogin[] {
    this.log('info', `Normalizing ${chromeLogins.length} Chrome login entries`);
    
    return chromeLogins.map((login, index) => ({
      id: `chr_login_${login.id || index}`,
      url: login.origin_url || '',
      domain: this.extractDomain(login.origin_url || ''),
      username: login.username_value || '',
      passwordHash: login.password_value || '[ENCRYPTED]',
      dateCreated: new Date(parseInt(login.date_created) / 1000) || new Date(),
      dateLastUsed: new Date(parseInt(login.date_last_used) / 1000) || new Date(),
      sourceProfile: profilePath,
      sourceBrowser: browserType,
      formSubmitUrl: login.submit_element,
      usernameField: login.username_element,
      passwordField: login.password_element,
      timesUsed: login.times_used || 1
    }));
  }

  // Create complete normalized dataset
  async createUniversalDataset(extractedData: any): Promise<NormalizedDataSet> {
    this.log('info', 'Creating universal intermediate dataset');
    
    const dataset: NormalizedDataSet = {
      bookmarks: [],
      history: [],
      logins: [],
      cookies: [],
      extensions: [],
      tabs: [],
      metadata: {
        extractionDate: new Date(),
        totalRecords: 0,
        sourceProfiles: [],
        version: '2.0.0'
      }
    };

    // Process each browser profile's data
    for (const profile of extractedData.profiles || []) {
      dataset.metadata.sourceProfiles.push(profile.path);
      
      // Normalize bookmarks
      if (profile.bookmarks) {
        const normalized = profile.browserType === BrowserType.FIREFOX
          ? this.normalizeFirefoxBookmarks(profile.bookmarks, profile.path)
          : this.normalizeChromeBookmarks(profile.bookmarks, profile.path, profile.browserType);
        dataset.bookmarks.push(...normalized);
      }

      // Normalize history
      if (profile.history) {
        const normalized = profile.browserType === BrowserType.FIREFOX
          ? this.normalizeFirefoxHistory(profile.history, profile.path)
          : this.normalizeChromeHistory(profile.history, profile.path, profile.browserType);
        dataset.history.push(...normalized);
      }

      // Normalize logins
      if (profile.logins) {
        const normalized = profile.browserType === BrowserType.FIREFOX
          ? this.normalizeFirefoxLogins(profile.logins, profile.path)
          : this.normalizeChromeLogins(profile.logins, profile.path, profile.browserType);
        dataset.logins.push(...normalized);
      }
    }

    dataset.metadata.totalRecords = 
      dataset.bookmarks.length + 
      dataset.history.length + 
      dataset.logins.length + 
      dataset.cookies.length + 
      dataset.extensions.length + 
      dataset.tabs.length;

    this.log('success', `Universal dataset created: ${dataset.metadata.totalRecords} total records`, 
      `${dataset.bookmarks.length} bookmarks, ${dataset.history.length} history, ${dataset.logins.length} logins`);
    
    return dataset;
  }

  // Helper methods
  private parseFirefoxFolderPath(folder: string): string[] {
    return folder.split('/').filter(f => f.length > 0);
  }

  private parseChromeFolderPath(folder: string): string[] {
    return folder.split('/').filter(f => f.length > 0);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private extractSearchTerm(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('q') || urlObj.searchParams.get('search') || undefined;
    } catch {
      return undefined;
    }
  }
}