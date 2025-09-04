export interface FirefoxProfile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  firefoxVersion?: string;
  profileType: string;
  validation: ProfileValidationResult;
}

export interface ProfileValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

export enum ConflictResolution {
  KEEP_NEWEST = "keep_newest",
  KEEP_OLDEST = "keep_oldest",
  MANUAL = "manual",
  KEEP_ALL = "keep_all",
  CUSTOM = "custom"
}

export enum MergeDataType {
  BOOKMARKS = "bookmarks",
  HISTORY = "history",
  PASSWORDS = "passwords",
  COOKIES = "cookies",
  EXTENSIONS = "extensions",
  PREFERENCES = "preferences",
  FORM_HISTORY = "form_history",
  PERMISSIONS = "permissions",
  SESSIONS = "sessions",
  ALL = "all"
}

export enum CompressionType {
  ZIP = "zip",
  GZIP = "gzip",
  BZIP2 = "bzip2",
  NONE = "none"
}

export interface MergeConfig {
  mergeTypes: MergeDataType[];
  conflictResolution: ConflictResolution;
  dryRun: boolean;
  backup: boolean;
  compression: CompressionType;
  outputLocation: string | null;
  profileCleanup: boolean;
  sessionRecovery: boolean;
}

export interface MergeStats {
  [key: string]: {
    added: number;
    skipped: number;
    total: number;
  };
}

export interface ComparisonData {
  bookmarks: ComparisonResult;
  history: ComparisonResult;
  passwords: ComparisonResult;
  cookies: ComparisonResult;
  extensions: ComparisonResult;
  preferences: ComparisonResult;
  similarityScore: number;
}

export interface ComparisonResult {
  count1: number;
  count2: number;
  similarity: number;
  difference: number;
  common?: number;
  uniqueTo1?: number;
  uniqueTo2?: number;
}