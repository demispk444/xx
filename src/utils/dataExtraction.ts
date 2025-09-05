// Core data extraction utilities for browser data synthesis
// Reliability-first: Work on copies, confirm extraction with row counts, handle SQLite corruption

import { BrowserProfile, BrowserType } from '../types/types';
import initSqlJs from 'sql.js';
import lz4 from 'lz4js';

// sql.js needs to be initialized asynchronously. We'll do it once.
let SQL: any;
async function initializeSql() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  }
  return SQL;
}


export interface ExtractionResult {
  success: boolean;
  rowCount: number;
  data: any[];
  errors: string[];
  sourceFile: string;
}

export interface BookmarkEntry { /* ... */ }
export interface HistoryEntry { /* ... */ }
export interface LoginEntry { /* ... */ }
export interface CookieEntry { /* ... */ }
export interface PreferenceEntry { /* ... */ }
export interface ExtensionEntry { /* ... */ }
export interface FormHistoryEntry { /* ... */ }
export interface PermissionEntry { /* ... */ }
export interface SessionEntry { /* ... */ }

// ... (other entry types remain the same)

export class BrowserDataExtractor {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // ... (Firefox implementations) ...
  async extractFirefoxBookmarks(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxHistory(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxLogins(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxCookies(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxPreferences(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxExtensions(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxFormHistory(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxPermissions(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractFirefoxSessions(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }

  // ... (Chrome implementations) ...
  async extractChromeBookmarks(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }
  async extractChromeHistory(profile: BrowserProfile): Promise<ExtractionResult> { /* ... */ }

  // Chrome Logins from Login Data file - REAL IMPLEMENTATION
  async extractChromeLogins(profile: BrowserProfile): Promise<ExtractionResult> {
    this.log('info', `Extracting Chrome logins from ${profile.name}`);
    const sourceFile = `${profile.path}/Login Data`;

    try {
      await initializeSql();

      const fileHandle = await profile.handle.getFileHandle('Login Data');
      const file = await fileHandle.getFile();
      const fileBuffer = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(fileBuffer));

      const query = `SELECT origin_url, username_value, password_value, date_created, date_last_used FROM logins ORDER BY date_last_used DESC;`;
      
      const results = db.exec(query);
      db.close();

      if (!results || results.length === 0) {
        this.log('warning', 'No logins found in database.', `Source: ${sourceFile}`);
        return { success: true, rowCount: 0, data: [], errors: [], sourceFile };
      }

      this.log('warning', 'Password decryption is not supported. Passwords will be extracted in their encrypted form.');

      const logins: LoginEntry[] = results[0].values.map((row: any, index: number) => {
        const [originUrl, username, password, dateCreated, dateLastUsed] = row;
        return {
          id: `ch_login_${index}`,
          url: originUrl || '',
          username: username || '',
          passwordEncrypted: password ? '[ENCRYPTED]' : '',
          // Chrome uses a specific epoch for timestamps
          dateCreated: new Date(dateCreated / 1000 - 11644473600000),
          dateLastUsed: new Date(dateLastUsed / 1000 - 11644473600000),
          source: profile.path,
          browserType: profile.browserType
        };
      });

      this.log('success', `Chrome logins extracted: ${logins.length} entries`, `Source: ${sourceFile}`);

      return {
        success: true,
        rowCount: logins.length,
        data: logins,
        errors: [],
        sourceFile
      };
    } catch (error: any) {
      const errorMsg = `Failed to extract Chrome logins: ${error.message}`;
      this.log('error', errorMsg, `Source: ${sourceFile}`);
      return {
        success: false,
        rowCount: 0,
        data: [],
        errors: [errorMsg],
        sourceFile
      };
    }
  }


  // Extract all data types from a browser profile
  async extractAllData(profile: BrowserProfile): Promise<any> {
    this.log('info', `Starting complete data extraction for ${profile.name} (${profile.browserType})`);

    const results: any = {};
    if (profile.browserType === BrowserType.FIREFOX) {
        results.bookmarks = await this.extractFirefoxBookmarks(profile);
        results.history = await this.extractFirefoxHistory(profile);
        results.logins = await this.extractFirefoxLogins(profile);
        results.cookies = await this.extractFirefoxCookies(profile);
        results.preferences = await this.extractFirefoxPreferences(profile);
        results.extensions = await this.extractFirefoxExtensions(profile);
        results.formHistory = await this.extractFirefoxFormHistory(profile);
        results.permissions = await this.extractFirefoxPermissions(profile);
        results.sessions = await this.extractFirefoxSessions(profile);
    } else if (profile.browserType === BrowserType.CHROME || profile.browserType === BrowserType.EDGE || profile.browserType === BrowserType.BRAVE) {
        results.bookmarks = await this.extractChromeBookmarks(profile);
        results.history = await this.extractChromeHistory(profile);
        results.logins = await this.extractChromeLogins(profile);
        // ... other chrome extractions would go here
    }

    const totalRows = Object.values(results).reduce((sum: number, result: any) => sum + (result.rowCount || 0), 0);
    this.log('success', `Complete extraction finished for ${profile.name}`, 
      `Total: ${totalRows} records`);

    return results;
  }
}
