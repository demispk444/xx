// Real SQLite Processing - Use sql.js WebAssembly for actual database operations
// Replaces mock SQLite operations with genuine database processing

import initSqlJs from 'sql.js';

export interface SQLiteResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount: number;
  error?: string;
}

export interface DatabaseInfo {
  path: string;
  size: number;
  tables: string[];
  isCorrupted: boolean;
  version?: string;
}

export class SQLiteProcessor {
  private SQL: any = null;
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Initialize SQLite WebAssembly
  async initialize(): Promise<void> {
    if (this.SQL) return; // Already initialized
    
    this.log('info', 'Initializing SQLite WebAssembly...');
    
    try {
      this.SQL = await initSqlJs({
        // Use CDN for WebAssembly files
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
      
      this.log('success', 'SQLite WebAssembly initialized successfully');
    } catch (error) {
      this.log('error', `Failed to initialize SQLite: ${error}`);
      throw error;
    }
  }

  // Open SQLite database from ArrayBuffer
  async openDatabase(data: ArrayBuffer, dbPath: string): Promise<any> {
    await this.initialize();
    
    this.log('info', `Opening database: ${dbPath}`);
    
    try {
      const db = new this.SQL.Database(new Uint8Array(data));
      this.log('success', `Database opened: ${dbPath} (${data.byteLength} bytes)`);
      return db;
    } catch (error) {
      this.log('error', `Failed to open database ${dbPath}: ${error}`);
      throw error;
    }
  }

  // Get database information and schema
  async getDatabaseInfo(db: any, dbPath: string): Promise<DatabaseInfo> {
    this.log('info', `Analyzing database structure: ${dbPath}`);
    
    try {
      // Get all table names
      const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      const tables = tablesResult.length > 0 ? tablesResult[0].values.map((row: any) => row[0]) : [];
      
      // Check if database is corrupted
      let isCorrupted = false;
      try {
        db.exec("PRAGMA integrity_check");
      } catch (error) {
        isCorrupted = true;
        this.log('warning', `Database integrity check failed: ${error}`);
      }
      
      // Get database version (for Firefox)
      let version;
      try {
        if (tables.includes('moz_meta')) {
          const versionResult = db.exec("SELECT value FROM moz_meta WHERE key='moz_version'");
          version = versionResult.length > 0 ? versionResult[0].values[0][0] : undefined;
        }
      } catch (error) {
        // Version info not available
      }
      
      const info: DatabaseInfo = {
        path: dbPath,
        size: db.export().length,
        tables,
        isCorrupted,
        version
      };
      
      this.log('success', `Database analysis complete: ${tables.length} tables found`);
      return info;
    } catch (error) {
      this.log('error', `Failed to analyze database: ${error}`);
      throw error;
    }
  }

  // Execute SQL query and return results
  async executeQuery(db: any, query: string): Promise<SQLiteResult> {
    this.log('info', `Executing query: ${query.substring(0, 100)}...`);
    
    try {
      const results = db.exec(query);
      
      if (results.length === 0) {
        return {
          success: true,
          data: [],
          columns: [],
          rowCount: 0
        };
      }
      
      const result = results[0];
      const data = result.values.map((row: any) => {
        const obj: any = {};
        result.columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      });
      
      this.log('success', `Query executed: ${data.length} rows returned`);
      
      return {
        success: true,
        data,
        columns: result.columns,
        rowCount: data.length
      };
    } catch (error) {
      this.log('error', `Query failed: ${(error as Error).message}`);
      return {
        success: false,
        rowCount: 0,
        error: error.toString()
      };
    }
  }

  // Extract Firefox bookmarks from places.sqlite
  async extractFirefoxBookmarks(db: any): Promise<SQLiteResult> {
    this.log('info', 'Extracting Firefox bookmarks...');
    
    const query = `
      SELECT 
        p.id,
        p.url,
        p.title,
        p.visit_count,
        p.last_visit_date,
        b.dateAdded,
        b.lastModified,
        b.parent,
        b.position,
        b.type,
        pt.title as folder_title
      FROM moz_places p
      JOIN moz_bookmarks b ON p.id = b.fk
      LEFT JOIN moz_bookmarks pt ON b.parent = pt.id
      WHERE b.type = 1 
        AND p.url IS NOT NULL 
        AND p.url NOT LIKE 'place:%'
      ORDER BY b.dateAdded DESC
    `;
    
    return await this.executeQuery(db, query);
  }

  // Extract Firefox history from places.sqlite
  async extractFirefoxHistory(db: any): Promise<SQLiteResult> {
    this.log('info', 'Extracting Firefox history...');
    
    const query = `
      SELECT 
        p.id,
        p.url,
        p.title,
        p.visit_count,
        p.last_visit_date,
        p.frecency,
        h.visit_date,
        h.visit_type,
        h.from_visit
      FROM moz_places p
      JOIN moz_historyvisits h ON p.id = h.place_id
      WHERE p.url IS NOT NULL
        AND p.url NOT LIKE 'place:%'
        AND p.hidden = 0
      ORDER BY h.visit_date DESC
      LIMIT 50000
    `;
    
    return await this.executeQuery(db, query);
  }

  // Extract Firefox logins from logins.json (handled separately)
  async extractFirefoxLogins(loginsData: string): Promise<any[]> {
    this.log('info', 'Extracting Firefox logins...');
    
    try {
      const parsed = JSON.parse(loginsData);
      const logins = parsed.logins || [];
      
      this.log('success', `Extracted ${logins.length} Firefox logins`);
      return logins.map((login: any) => ({
        id: login.id,
        hostname: login.hostname,
        username: login.encryptedUsername,
        password: login.encryptedPassword,
        formSubmitURL: login.formSubmitURL,
        timeCreated: login.timeCreated,
        timeLastUsed: login.timeLastUsed,
        timesUsed: login.timesUsed
      }));
    } catch (error) {
      this.log('error', `Failed to parse Firefox logins: ${error}`);
      return [];
    }
  }

  // Extract Chrome bookmarks from Bookmarks JSON file
  async extractChromeBookmarks(bookmarksData: string): Promise<any[]> {
    this.log('info', 'Extracting Chrome bookmarks...');
    
    try {
      const parsed = JSON.parse(bookmarksData);
      const bookmarks: any[] = [];
      
      // Recursively extract bookmarks from bookmark tree
      const extractFromFolder = (folder: any, path = '') => {
        if (folder.children) {
          for (const child of folder.children) {
            if (child.type === 'url') {
              bookmarks.push({
                id: child.id,
                name: child.name,
                url: child.url,
                date_added: child.date_added,
                date_modified: child.date_modified,
                folder_path: path
              });
            } else if (child.type === 'folder') {
              extractFromFolder(child, `${path}/${child.name}`);
            }
          }
        }
      };
      
      // Extract from bookmark bar and other folders
      if (parsed.roots) {
        if (parsed.roots.bookmark_bar) {
          extractFromFolder(parsed.roots.bookmark_bar, 'Bookmarks Bar');
        }
        if (parsed.roots.other) {
          extractFromFolder(parsed.roots.other, 'Other Bookmarks');
        }
        if (parsed.roots.synced) {
          extractFromFolder(parsed.roots.synced, 'Mobile Bookmarks');
        }
      }
      
      this.log('success', `Extracted ${bookmarks.length} Chrome bookmarks`);
      return bookmarks;
    } catch (error) {
      this.log('error', `Failed to parse Chrome bookmarks: ${error}`);
      return [];
    }
  }

  // Extract Chrome history from History SQLite database
  async extractChromeHistory(db: any): Promise<SQLiteResult> {
    this.log('info', 'Extracting Chrome history...');
    
    const query = `
      SELECT 
        u.id,
        u.url,
        u.title,
        u.visit_count,
        u.typed_count,
        u.last_visit_time,
        v.visit_time,
        v.transition
      FROM urls u
      LEFT JOIN visits v ON u.id = v.url
      WHERE u.url IS NOT NULL
      ORDER BY u.last_visit_time DESC
      LIMIT 50000
    `;
    
    return await this.executeQuery(db, query);
  }

  // Extract Chrome logins from Login Data SQLite database
  async extractChromeLogins(db: any): Promise<SQLiteResult> {
    this.log('info', 'Extracting Chrome logins...');
    
    const query = `
      SELECT 
        origin_url,
        action_url,
        username_element,
        username_value,
        password_element,
        password_value,
        date_created,
        date_last_used,
        times_used,
        blacklisted_by_user
      FROM logins
      WHERE blacklisted_by_user = 0
      ORDER BY date_last_used DESC
    `;
    
    return await this.executeQuery(db, query);
  }

  // Close database and free memory
  closeDatabase(db: any): void {
    try {
      db.close();
      this.log('info', 'Database closed successfully');
    } catch (error) {
      this.log('warning', `Error closing database: ${error}`);
    }
  }

  // Export database to SQL dump
  async exportToSQL(db: any): Promise<string> {
    this.log('info', 'Exporting database to SQL dump...');
    
    try {
      const sql = db.export();
      const sqlString = new TextDecoder().decode(sql);
      
      this.log('success', `Database exported to SQL (${sqlString.length} bytes)`);
      return sqlString;
    } catch (error) {
      this.log('error', `Failed to export database: ${error}`);
      throw error;
    }
  }
}