// Deduplication Engine - Intelligent duplicate detection and resolution
// Reliability-first: Preview all changes, never auto-delete without approval

import { UniversalBookmark, UniversalHistoryEntry, UniversalLogin, NormalizedDataSet } from './universalDataNormalizer';

export interface DuplicateGroup {
  id: string;
  type: 'bookmark' | 'history' | 'login';
  items: any[];
  confidence: number;
  reason: string;
  suggestedKeep?: any;
}

export interface DeduplicationConfig {
  bookmarkStrategy: 'keep_newest' | 'keep_oldest' | 'keep_most_used' | 'manual' | 'keep_all';
  historyStrategy: 'merge_visits' | 'keep_newest' | 'keep_most_visits' | 'manual' | 'keep_all';
  loginStrategy: 'keep_newest' | 'keep_most_used' | 'manual' | 'keep_all';
  urlSimilarityThreshold: number; // 0.0 to 1.0
  titleSimilarityThreshold: number; // 0.0 to 1.0
  autoApproveHighConfidence: boolean;
  previewAllChanges: boolean;
}

export interface DeduplicationResult {
  duplicateGroups: DuplicateGroup[];
  potentialMerges: number;
  estimatedReduction: number;
  requiresUserReview: number;
}

export class DeduplicationEngine {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Main deduplication analysis
  async analyzeDataset(dataset: NormalizedDataSet, config: DeduplicationConfig): Promise<DeduplicationResult> {
    this.log('info', '═══ STARTING DEDUPLICATION ANALYSIS ═══');
    this.log('info', `Analyzing ${dataset.metadata.totalRecords} records for duplicates`);

    const duplicateGroups: DuplicateGroup[] = [];

    // Analyze bookmarks
    this.log('info', `Analyzing ${dataset.bookmarks.length} bookmarks for duplicates`);
    const bookmarkDuplicates = await this.findBookmarkDuplicates(dataset.bookmarks, config);
    duplicateGroups.push(...bookmarkDuplicates);
    this.log('success', `Found ${bookmarkDuplicates.length} bookmark duplicate groups`);

    // Analyze history
    this.log('info', `Analyzing ${dataset.history.length} history entries for duplicates`);
    const historyDuplicates = await this.findHistoryDuplicates(dataset.history, config);
    duplicateGroups.push(...historyDuplicates);
    this.log('success', `Found ${historyDuplicates.length} history duplicate groups`);

    // Analyze logins
    this.log('info', `Analyzing ${dataset.logins.length} login entries for duplicates`);
    const loginDuplicates = await this.findLoginDuplicates(dataset.logins, config);
    duplicateGroups.push(...loginDuplicates);
    this.log('success', `Found ${loginDuplicates.length} login duplicate groups`);

    const potentialMerges = duplicateGroups.reduce((sum, group) => sum + group.items.length - 1, 0);
    const requiresUserReview = duplicateGroups.filter(group => 
      group.confidence < 0.9 || !config.autoApproveHighConfidence
    ).length;

    this.log('success', '═══ DEDUPLICATION ANALYSIS COMPLETE ═══');
    this.log('info', `Total duplicate groups: ${duplicateGroups.length}`);
    this.log('info', `Potential merges: ${potentialMerges}`);
    this.log('info', `Requires user review: ${requiresUserReview}`);

    return {
      duplicateGroups,
      potentialMerges,
      estimatedReduction: potentialMerges,
      requiresUserReview
    };
  }

  // Find bookmark duplicates
  private async findBookmarkDuplicates(bookmarks: UniversalBookmark[], config: DeduplicationConfig): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < bookmarks.length; i++) {
      if (processed.has(bookmarks[i].id)) continue;

      const bookmark = bookmarks[i];
      const duplicates = [bookmark];
      processed.add(bookmark.id);

      // Find similar bookmarks
      for (let j = i + 1; j < bookmarks.length; j++) {
        if (processed.has(bookmarks[j].id)) continue;
        
        const other = bookmarks[j];
        const similarity = this.calculateBookmarkSimilarity(bookmark, other);
        
        if (similarity.url >= config.urlSimilarityThreshold || 
            (similarity.title >= config.titleSimilarityThreshold && similarity.url > 0.7)) {
          duplicates.push(other);
          processed.add(other.id);
        }
      }

      // Create duplicate group if we found matches
      if (duplicates.length > 1) {
        const suggestedKeep = this.suggestBookmarkToKeep(duplicates, config.bookmarkStrategy);
        
        duplicateGroups.push({
          id: `bookmark_dup_${duplicateGroups.length}`,
          type: 'bookmark',
          items: duplicates,
          confidence: this.calculateGroupConfidence(duplicates, 'bookmark'),
          reason: this.generateDuplicateReason(duplicates, 'bookmark'),
          suggestedKeep
        });
      }
    }

    return duplicateGroups;
  }

  // Find history duplicates
  private async findHistoryDuplicates(history: UniversalHistoryEntry[], config: DeduplicationConfig): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const urlGroups = new Map<string, UniversalHistoryEntry[]>();

    // Group by exact URL first
    for (const entry of history) {
      const normalized = this.normalizeUrl(entry.url);
      if (!urlGroups.has(normalized)) {
        urlGroups.set(normalized, []);
      }
      urlGroups.get(normalized)!.push(entry);
    }

    // Process groups with multiple entries
    for (const [, entries] of urlGroups) {
      if (entries.length > 1) {
        const suggestedKeep = this.suggestHistoryToKeep(entries, config.historyStrategy);
        
        duplicateGroups.push({
          id: `history_dup_${duplicateGroups.length}`,
          type: 'history',
          items: entries,
          confidence: 1.0, // Exact URL matches are high confidence
          reason: `Identical URLs with ${entries.length} visits across browsers`,
          suggestedKeep
        });
      }
    }

    return duplicateGroups;
  }

  // Find login duplicates
  private async findLoginDuplicates(logins: UniversalLogin[], config: DeduplicationConfig): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < logins.length; i++) {
      if (processed.has(logins[i].id)) continue;

      const login = logins[i];
      const duplicates = [login];
      processed.add(login.id);

      // Find logins with same domain and username
      for (let j = i + 1; j < logins.length; j++) {
        if (processed.has(logins[j].id)) continue;
        
        const other = logins[j];
        
        if (login.domain === other.domain && login.username === other.username) {
          duplicates.push(other);
          processed.add(other.id);
        }
      }

      // Create duplicate group if we found matches
      if (duplicates.length > 1) {
        const suggestedKeep = this.suggestLoginToKeep(duplicates, config.loginStrategy);
        
        duplicateGroups.push({
          id: `login_dup_${duplicateGroups.length}`,
          type: 'login',
          items: duplicates,
          confidence: 0.95, // Domain + username matches are very high confidence
          reason: `Same domain (${login.domain}) and username (${login.username})`,
          suggestedKeep
        });
      }
    }

    return duplicateGroups;
  }

  // Calculate bookmark similarity
  private calculateBookmarkSimilarity(bookmark1: UniversalBookmark, bookmark2: UniversalBookmark): { url: number; title: number } {
    const urlSimilarity = this.calculateUrlSimilarity(bookmark1.url, bookmark2.url);
    const titleSimilarity = this.calculateStringSimilarity(bookmark1.title, bookmark2.title);
    
    return { url: urlSimilarity, title: titleSimilarity };
  }

  // Calculate URL similarity
  private calculateUrlSimilarity(url1: string, url2: string): number {
    if (url1 === url2) return 1.0;
    
    // Normalize URLs for comparison
    const norm1 = this.normalizeUrl(url1);
    const norm2 = this.normalizeUrl(url2);
    
    if (norm1 === norm2) return 0.95;
    
    // Check if one is a subset of the other (with parameters)
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    // Calculate string similarity
    return this.calculateStringSimilarity(norm1, norm2);
  }

  // Calculate string similarity using Levenshtein distance
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Normalize URL for comparison
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove www, trailing slashes, common parameters
      let normalized = urlObj.protocol + '//' + urlObj.hostname.replace(/^www\./, '') + urlObj.pathname;
      normalized = normalized.replace(/\/+$/, ''); // Remove trailing slashes
      return normalized;
    } catch {
      return url.toLowerCase().trim();
    }
  }

  // Suggest which bookmark to keep
  private suggestBookmarkToKeep(bookmarks: UniversalBookmark[], strategy: string): UniversalBookmark {
    switch (strategy) {
      case 'keep_newest':
        return bookmarks.reduce((newest, current) => 
          current.dateAdded > newest.dateAdded ? current : newest);
      
      case 'keep_oldest':
        return bookmarks.reduce((oldest, current) => 
          current.dateAdded < oldest.dateAdded ? current : oldest);
      
      case 'keep_most_used':
        return bookmarks.reduce((mostUsed, current) => 
          (current.visitCount || 0) > (mostUsed.visitCount || 0) ? current : mostUsed);
      
      default:
        return bookmarks[0]; // Manual review required
    }
  }

  // Suggest which history entry to keep
  private suggestHistoryToKeep(entries: UniversalHistoryEntry[], strategy: string): UniversalHistoryEntry {
    switch (strategy) {
      case 'keep_newest':
        return entries.reduce((newest, current) => 
          current.lastVisit > newest.lastVisit ? current : newest);
      
      case 'keep_most_visits':
        return entries.reduce((mostVisits, current) => 
          current.visitCount > mostVisits.visitCount ? current : mostVisits);
      
      case 'merge_visits':
        // For merge strategy, return the one with most visits as base
        return entries.reduce((mostVisits, current) => 
          current.visitCount > mostVisits.visitCount ? current : mostVisits);
      
      default:
        return entries[0]; // Manual review required
    }
  }

  // Suggest which login to keep
  private suggestLoginToKeep(logins: UniversalLogin[], strategy: string): UniversalLogin {
    switch (strategy) {
      case 'keep_newest':
        return logins.reduce((newest, current) => 
          current.dateLastUsed > newest.dateLastUsed ? current : newest);
      
      case 'keep_most_used':
        return logins.reduce((mostUsed, current) => 
          current.timesUsed > mostUsed.timesUsed ? current : mostUsed);
      
      default:
        return logins[0]; // Manual review required
    }
  }

  // Calculate group confidence
  private calculateGroupConfidence(items: any[], type: string): number {
    if (type === 'history' && items.every((item: any) => item.url === items[0].url)) {
      return 1.0; // Exact URL matches
    }
    
    if (type === 'login' && items.every((item: any) => 
      item.domain === items[0].domain && item.username === items[0].username)) {
      return 0.95; // Domain + username matches
    }
    
    // For bookmarks, calculate average similarity
    if (type === 'bookmark' && items.length === 2) {
      const similarity = this.calculateBookmarkSimilarity(items[0], items[1]);
      return Math.max(similarity.url, similarity.title);
    }
    
    return 0.8; // Default medium confidence
  }

  // Generate human-readable duplicate reason
  private generateDuplicateReason(items: any[], type: string): string {
    const count = items.length;
    
    switch (type) {
      case 'bookmark':
        return `${count} bookmarks with similar URLs and titles`;
      case 'history':
        return `${count} history entries for the same URL`;
      case 'login':
        return `${count} login credentials for the same domain and username`;
      default:
        return `${count} similar items detected`;
    }
  }
}