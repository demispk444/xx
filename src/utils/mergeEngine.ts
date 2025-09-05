import { BrowserProfile, MergeConfig, MergeDataType } from '../types/types';
import { BrowserDataExtractor, BookmarkEntry, HistoryEntry, LoginEntry, CookieEntry, PreferenceEntry, ExtensionEntry, FormHistoryEntry, PermissionEntry, SessionEntry } from './dataExtraction';
import initSqlJs from 'sql.js';

let SQL: any;
async function initializeSql() {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
  }
  return SQL;
}

export class MergeEngine {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  async generateMergePreview(
    profiles: BrowserProfile[],
    config: MergeConfig
  ): Promise<{ success: boolean; mergedData?: any; stats?: any; error?: string }> {
    // ... (existing implementation)
    return { success: true, mergedData: {}, stats: {} };
  }

  private deduplicate<T>(items: T[], getKey: (item: T) => any): T[] {
    // ... (existing implementation)
    return [];
  }

  /**
   * Writes the merged data to a new profile structure.
   * Phase 1: Write bookmarks to a new places.sqlite database.
   */
  async writeMergedProfile(mergedData: any): Promise<{ success: boolean; files?: { name: string, content: Uint8Array }[]; error?: string }> {
    this.log('info', 'Beginning to write merged profile...');

    try {
      await initializeSql();
      const db = new SQL.Database();

      // Write bookmarks and history to places.sqlite
      const placesDbContent = this.createPlacesDatabase(mergedData.bookmarks?.data, mergedData.history?.data);
      
      // In future, other files would be created here (e.g., logins.json)

      db.close();
      this.log('success', 'Successfully created new profile files in memory.');

      return {
        success: true,
        files: [
          { name: 'places.sqlite', content: placesDbContent },
        ]
      };
    } catch (error: any) {
      this.log('error', 'Failed to write merged profile', error.message);
      return { success: false, error: error.message };
    }
  }

  private createPlacesDatabase(bookmarks: BookmarkEntry[], history: HistoryEntry[]): Uint8Array {
    this.log('info', 'Creating new places.sqlite database...');
    const db = new SQL.Database();

    // Create schema
    const schema = `
      CREATE TABLE moz_places (
          id INTEGER PRIMARY KEY,
          url LONGVARCHAR,
          title LONGVARCHAR,
          visit_count INTEGER DEFAULT 0,
          last_visit_date INTEGER
      );
      CREATE TABLE moz_bookmarks (
          id INTEGER PRIMARY KEY,
          type INTEGER,
          fk INTEGER,
          parent INTEGER,
          position INTEGER,
          title LONGVARCHAR,
          dateAdded INTEGER,
          lastModified INTEGER
      );
      -- Add other necessary tables and indices here in a real implementation
    `;
    db.run(schema);

    // Insert bookmarks
    if (bookmarks) {
      this.log('info', `Writing ${bookmarks.length} bookmarks...`);
      const stmt = db.prepare("INSERT INTO moz_places (url, title, visit_count, last_visit_date) VALUES (?, ?, 0, ?)");
      const stmt2 = db.prepare("INSERT INTO moz_bookmarks (type, fk, parent, position, title, dateAdded, lastModified) VALUES (1, ?, 4, 0, ?, ?, ?)");

      for (const bookmark of bookmarks) {
        const now = new Date().getTime() * 1000;
        stmt.run([bookmark.url, bookmark.title, now]);
        const placeId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
        stmt2.run([placeId, bookmark.title, bookmark.dateAdded.getTime() * 1000, now]);
      }
      stmt.free();
      stmt2.free();
    }

    // In a real implementation, history would be written here too

    const content = db.export();
    db.close();
    this.log('success', 'Finished creating places.sqlite database.');
    return content;
  }
}
