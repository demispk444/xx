// Enhanced Merge Engine - Real selective merging with configurable data types
// Respects the MergeConfig.mergeTypes array for granular control

import { MergeDataType, MergeConfig, ConflictResolution } from '../types/types';
import { RealExtractionResult } from './realDataExtraction';

export interface MergeOperation {
  sourceProfile: string;
  targetProfile: string;
  dataTypes: MergeDataType[];
  conflictResolution: ConflictResolution;
  dryRun: boolean;
}

export interface MergeResult {
  success: boolean;
  mergedItems: number;
  conflictsResolved: number;
  errors: string[];
  details: {
    bookmarks: { merged: number; conflicts: number };
    history: { merged: number; conflicts: number };
    logins: { merged: number; conflicts: number };
    cookies: { merged: number; conflicts: number };
    extensions: { merged: number; conflicts: number };
    formHistory: { merged: number; conflicts: number };
    permissions: { merged: number; conflicts: number };
    sessions: { merged: number; conflicts: number };
  };
  executionTime: number;
}

export class EnhancedMergeEngine {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Main merge method respecting selective merge configuration
  async mergeProfiles(
    sourceData: Map<string, RealExtractionResult>,
    targetProfilePath: string,
    config: MergeConfig
  ): Promise<MergeResult> {
    const startTime = Date.now();
    
    this.log('info', '═══ STARTING SELECTIVE MERGE ═══');
    this.log('info', `Target profile: ${targetProfilePath}`);
    this.log('info', `Data types to merge: ${config.mergeTypes.join(', ')}`);
    this.log('info', `Conflict resolution: ${config.conflictResolution}`);
    this.log('info', `Dry run: ${config.dryRun ? 'Yes' : 'No'}`);

    const result: MergeResult = {
      success: false,
      mergedItems: 0,
      conflictsResolved: 0,
      errors: [],
      details: {
        bookmarks: { merged: 0, conflicts: 0 },
        history: { merged: 0, conflicts: 0 },
        logins: { merged: 0, conflicts: 0 },
        cookies: { merged: 0, conflicts: 0 },
        extensions: { merged: 0, conflicts: 0 },
        formHistory: { merged: 0, conflicts: 0 },
        permissions: { merged: 0, conflicts: 0 },
        sessions: { merged: 0, conflicts: 0 }
      },
      executionTime: 0
    };

    try {
      const targetData = sourceData.get(targetProfilePath);
      if (!targetData) {
        throw new Error(`Target profile data not found: ${targetProfilePath}`);
      }

      // Process each selected data type
      for (const dataType of config.mergeTypes) {
        if (dataType === MergeDataType.ALL) {
          // Merge all data types
          await this.mergeAllDataTypes(sourceData, targetData, config, result);
          break;
        } else {
          // Merge specific data type
          await this.mergeSpecificDataType(dataType, sourceData, targetData, config, result);
        }
      }

      result.success = result.errors.length === 0;
      result.mergedItems = Object.values(result.details).reduce((sum, detail) => sum + detail.merged, 0);
      result.conflictsResolved = Object.values(result.details).reduce((sum, detail) => sum + detail.conflicts, 0);

      this.log('success', '═══ SELECTIVE MERGE COMPLETE ═══');
      this.logMergeResults(result);

    } catch (error) {
      result.errors.push(`Merge failed: ${(error as Error).message}`);
      this.log('error', `Merge operation failed: ${(error as Error).message}`);
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  // Merge all data types when MergeDataType.ALL is selected
  private async mergeAllDataTypes(
    sourceData: Map<string, RealExtractionResult>,
    targetData: RealExtractionResult,
    config: MergeConfig,
    result: MergeResult
  ): Promise<void> {
    this.log('info', 'Merging all data types...');

    const allTypes = [
      MergeDataType.BOOKMARKS,
      MergeDataType.HISTORY,
      MergeDataType.PASSWORDS,
      MergeDataType.COOKIES,
      MergeDataType.EXTENSIONS,
      MergeDataType.FORM_HISTORY,
      MergeDataType.PERMISSIONS,
      MergeDataType.SESSIONS
    ];

    for (const dataType of allTypes) {
      await this.mergeSpecificDataType(dataType, sourceData, targetData, config, result);
    }
  }

  // Merge specific data type based on user selection
  private async mergeSpecificDataType(
    dataType: MergeDataType,
    sourceData: Map<string, RealExtractionResult>,
    targetData: RealExtractionResult,
    config: MergeConfig,
    result: MergeResult
  ): Promise<void> {
    this.log('info', `Processing ${dataType}...`);

    try {
      switch (dataType) {
        case MergeDataType.BOOKMARKS:
          await this.mergeBookmarks(sourceData, targetData, config, result);
          break;
        case MergeDataType.HISTORY:
          await this.mergeHistory(sourceData, targetData, config, result);
          break;
        case MergeDataType.PASSWORDS:
          await this.mergeLogins(sourceData, targetData, config, result);
          break;
        case MergeDataType.COOKIES:
          await this.mergeCookies(sourceData, targetData, config, result);
          break;
        case MergeDataType.EXTENSIONS:
          await this.mergeExtensions(sourceData, targetData, config, result);
          break;
        case MergeDataType.FORM_HISTORY:
          await this.mergeFormHistory(sourceData, targetData, config, result);
          break;
        case MergeDataType.PERMISSIONS:
          await this.mergePermissions(sourceData, targetData, config, result);
          break;
        case MergeDataType.SESSIONS:
          await this.mergeSessions(sourceData, targetData, config, result);
          break;
        default:
          this.log('warning', `Unknown data type: ${dataType}`);
      }
    } catch (error) {
      result.errors.push(`Failed to merge ${dataType}: ${(error as Error).message}`);
      this.log('error', `Failed to merge ${dataType}: ${(error as Error).message}`);
    }
  }

  // Merge bookmarks from all source profiles
  private async mergeBookmarks(
    sourceData: Map<string, RealExtractionResult>,
    targetData: RealExtractionResult,
    config: MergeConfig,
    result: MergeResult
  ): Promise<void> {
    let merged = 0;
    let conflicts = 0;

    for (const [profilePath, data] of sourceData) {
      if (profilePath === targetData.toString() || data.bookmarks.length === 0) continue;

      this.log('info', `Merging ${data.bookmarks.length} bookmarks from ${profilePath.split('/').pop()}`);

      for (const bookmark of data.bookmarks) {
        // Check for duplicates in target
        const existingBookmark = targetData.bookmarks.find(b => b.url === bookmark.url);
        
        if (existingBookmark) {
          conflicts++;
          
          // Resolve conflict based on strategy
          if (this.shouldReplaceBookmark(existingBookmark, bookmark, config.conflictResolution)) {
            if (!config.dryRun) {
              // Replace existing bookmark
              const index = targetData.bookmarks.indexOf(existingBookmark);
              targetData.bookmarks[index] = { ...bookmark, mergedFrom: profilePath };
            }
            merged++;
          }
        } else {
          // No conflict - add new bookmark
          if (!config.dryRun) {
            targetData.bookmarks.push({ ...bookmark, mergedFrom: profilePath });
          }
          merged++;
        }
      }
    }

    result.details.bookmarks = { merged, conflicts };
    this.log('success', `Bookmarks merge complete: ${merged} merged, ${conflicts} conflicts resolved`);
  }

  // Merge browsing history from all source profiles
  private async mergeHistory(
    sourceData: Map<string, RealExtractionResult>,
    targetData: RealExtractionResult,
    config: MergeConfig,
    result: MergeResult
  ): Promise<void> {
    let merged = 0;
    let conflicts = 0;

    for (const [profilePath, data] of sourceData) {
      if (profilePath === targetData.toString() || data.history.length === 0) continue;

      this.log('info', `Merging ${data.history.length} history entries from ${profilePath.split('/').pop()}`);

      for (const historyEntry of data.history) {
        // Check for duplicates in target
        const existingEntry = targetData.history.find(h => h.url === historyEntry.url);
        
        if (existingEntry) {
          conflicts++;
          
          // Resolve conflict - for history, usually merge visit counts
          if (!config.dryRun) {
            existingEntry.visitCount += historyEntry.visitCount;
            if (historyEntry.lastVisitTime > existingEntry.lastVisitTime) {
              existingEntry.lastVisitTime = historyEntry.lastVisitTime;
            }
          }
          merged++;
        } else {
          // No conflict - add new history entry
          if (!config.dryRun) {
            targetData.history.push({ ...historyEntry, mergedFrom: profilePath });
          }
          merged++;
        }
      }
    }

    result.details.history = { merged, conflicts };
    this.log('success', `History merge complete: ${merged} merged, ${conflicts} conflicts resolved`);
  }

  // Merge saved logins/passwords
  private async mergeLogins(
    sourceData: Map<string, RealExtractionResult>,
    targetData: RealExtractionResult,
    config: MergeConfig,
    result: MergeResult
  ): Promise<void> {
    let merged = 0;
    let conflicts = 0;

    for (const [profilePath, data] of sourceData) {
      if (profilePath === targetData.toString() || data.logins.length === 0) continue;

      this.log('info', `Merging ${data.logins.length} login entries from ${profilePath.split('/').pop()}`);

      for (const login of data.logins) {
        // Check for duplicates based on hostname + username
        const existingLogin = targetData.logins.find(l => 
          l.hostname === login.hostname && l.username === login.username
        );
        
        if (existingLogin) {
          conflicts++;
          
          // Resolve conflict based on strategy
          if (this.shouldReplaceLogin(existingLogin, login, config.conflictResolution)) {
            if (!config.dryRun) {
              const index = targetData.logins.indexOf(existingLogin);
              targetData.logins[index] = { ...login, mergedFrom: profilePath };
            }
            merged++;
          }
        } else {
          // No conflict - add new login
          if (!config.dryRun) {
            targetData.logins.push({ ...login, mergedFrom: profilePath });
          }
          merged++;
        }
      }
    }

    result.details.logins = { merged, conflicts };
    this.log('success', `Logins merge complete: ${merged} merged, ${conflicts} conflicts resolved`);
  }

  // Placeholder methods for other data types
  private async mergeCookies(sourceData: Map<string, RealExtractionResult>, targetData: RealExtractionResult, config: MergeConfig, result: MergeResult): Promise<void> {
    // Implementation would merge cookie data
    result.details.cookies = { merged: 0, conflicts: 0 };
    this.log('info', 'Cookies merge not yet implemented');
  }

  private async mergeExtensions(sourceData: Map<string, RealExtractionResult>, targetData: RealExtractionResult, config: MergeConfig, result: MergeResult): Promise<void> {
    result.details.extensions = { merged: 0, conflicts: 0 };
    this.log('info', 'Extensions merge not yet implemented');
  }

  private async mergeFormHistory(sourceData: Map<string, RealExtractionResult>, targetData: RealExtractionResult, config: MergeConfig, result: MergeResult): Promise<void> {
    result.details.formHistory = { merged: 0, conflicts: 0 };
    this.log('info', 'Form history merge not yet implemented');
  }

  private async mergePermissions(sourceData: Map<string, RealExtractionResult>, targetData: RealExtractionResult, config: MergeConfig, result: MergeResult): Promise<void> {
    result.details.permissions = { merged: 0, conflicts: 0 };
    this.log('info', 'Permissions merge not yet implemented');
  }

  private async mergeSessions(sourceData: Map<string, RealExtractionResult>, targetData: RealExtractionResult, config: MergeConfig, result: MergeResult): Promise<void> {
    result.details.sessions = { merged: 0, conflicts: 0 };
    this.log('info', 'Sessions merge not yet implemented');
  }

  // Conflict resolution for bookmarks
  private shouldReplaceBookmark(existing: any, incoming: any, strategy: ConflictResolution): boolean {
    switch (strategy) {
      case ConflictResolution.KEEP_NEWEST:
        return incoming.lastModified > existing.lastModified;
      case ConflictResolution.KEEP_OLDEST:
        return incoming.dateAdded < existing.dateAdded;
      case ConflictResolution.KEEP_MOST_USED:
        return incoming.visitCount > existing.visitCount;
      case ConflictResolution.MANUAL:
        // In real implementation, this would prompt user
        return false;
      default:
        return false;
    }
  }

  // Conflict resolution for logins
  private shouldReplaceLogin(existing: any, incoming: any, strategy: ConflictResolution): boolean {
    switch (strategy) {
      case ConflictResolution.KEEP_NEWEST:
        return incoming.timeLastUsed > existing.timeLastUsed;
      case ConflictResolution.KEEP_OLDEST:
        return incoming.timeCreated < existing.timeCreated;
      case ConflictResolution.KEEP_MOST_USED:
        return incoming.timesUsed > existing.timesUsed;
      case ConflictResolution.MANUAL:
        return false;
      default:
        return false;
    }
  }

  // Log detailed merge results
  private logMergeResults(result: MergeResult): void {
    this.log('info', `Total items merged: ${result.mergedItems}`);
    this.log('info', `Conflicts resolved: ${result.conflictsResolved}`);
    this.log('info', `Execution time: ${result.executionTime}ms`);
    
    if (result.details.bookmarks.merged > 0) {
      this.log('info', `• Bookmarks: ${result.details.bookmarks.merged} merged (${result.details.bookmarks.conflicts} conflicts)`);
    }
    if (result.details.history.merged > 0) {
      this.log('info', `• History: ${result.details.history.merged} merged (${result.details.history.conflicts} conflicts)`);
    }
    if (result.details.logins.merged > 0) {
      this.log('info', `• Logins: ${result.details.logins.merged} merged (${result.details.logins.conflicts} conflicts)`);
    }
    
    if (result.errors.length > 0) {
      this.log('warning', `Errors encountered: ${result.errors.length}`);
      result.errors.forEach(error => this.log('error', error));
    }
  }
}