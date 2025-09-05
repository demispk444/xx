// Browser Profile Types
export enum BrowserType {
  FIREFOX = "firefox",
  CHROME = "chrome", 
  EDGE = "edge",
  BRAVE = "brave",
  CHROMIUM = "chromium"
}

export enum DataSourceType {
  BROWSER_PROFILE = "browser_profile",
  EXTENSION_BACKUP = "extension_backup",
  TAB_BACKUP = "tab_backup"
}

export interface BrowserProfile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  browserType: BrowserType;
  browserVersion?: string;
  profileType: string;
  validation: ProfileValidationResult;
  handle: any;
}

// Legacy interface for backward compatibility
export interface FirefoxProfile extends BrowserProfile {
  firefoxVersion?: string;
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

// Phase 1: Data Source Discovery Types
export interface DataSource {
  id: string;
  name: string;
  path: string;
  type: DataSourceType;
  browserType?: BrowserType;
  size: number;
  lastModified: Date;
  validation: SourceValidationResult;
}

export interface ExtensionBackup extends DataSource {
  format: ExtensionBackupFormat;
  extensionName?: string;
  tabCount?: number;
}

export enum ExtensionBackupFormat {
  ONETAB_TEXT = "onetab_text",
  ONETAB_JSON = "onetab_json", 
  SESSION_BUDDY = "session_buddy",
  TABMANAGER_PLUS = "tabmanager_plus",
  GENERIC_JSON = "generic_json",
  UNKNOWN = "unknown"
}

export interface SourceValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  confidence: number; // 0-1 confidence score
}

export interface DiscoveryResult {
  browserProfiles: BrowserProfile[];
  extensionBackups: ExtensionBackup[];
  totalSources: number;
  scanPath: string;
  timestamp: Date;
}

// Phase 2: Universal Data Format Types
export interface UniversalBookmark {
  id: string;
  title: string;
  url: string;
  folder: string;
  tags: string[];
  dateAdded: Date;
  lastModified: Date;
  favicon?: string;
  sourceProfile: string;
  sourceBrowser: BrowserType;
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
}

export interface UniversalLogin {
  id: string;
  hostname: string;
  username: string;
  encryptedPassword: string;
  dateCreated: Date;
  dateLastUsed: Date;
  sourceProfile: string;
  sourceBrowser: BrowserType;
}

export interface UniversalCookie {
  id: string;
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: Date;
  secure: boolean;
  httpOnly: boolean;
  sourceProfile: string;
  sourceBrowser: BrowserType;
}

export interface UniversalExtension {
  id: string;
  name: string;
  version: string;
  extensionId: string;
  enabled: boolean;
  installDate: Date;
  firefoxAddonUrl?: string;
  chromeStoreUrl?: string;
  sourceProfile: string;
  sourceBrowser: BrowserType;
  extractedData?: any;
}

export interface UniversalTabGroup {
  id: string;
  name: string;
  tabs: UniversalTab[];
  dateCreated: Date;
  sourceBackup: string;
  format: ExtensionBackupFormat;
}

export interface UniversalTab {
  id: string;
  url: string;
  title: string;
  favIcon?: string;
  dateAdded: Date;
}

// Phase 3: Synthesis Types
export interface SynthesisConfig {
  deduplicateBookmarks: boolean;
  bookmarkMergeStrategy: BookmarkMergeStrategy;
  historyRetentionDays: number;
  loginConflictResolution: LoginConflictStrategy;
  cookiePreference: CookiePreference;
  extensionHandling: ExtensionHandling;
}

export enum BookmarkMergeStrategy {
  KEEP_NEWEST = "keep_newest",
  KEEP_OLDEST = "keep_oldest", 
  MERGE_FOLDERS = "merge_folders",
  CREATE_SEPARATE_FOLDERS = "create_separate_folders"
}

export enum LoginConflictStrategy {
  PROMPT_USER = "prompt_user",
  KEEP_NEWEST = "keep_newest",
  KEEP_ALL = "keep_all"
}

export enum CookiePreference {
  FIREFOX_ONLY = "firefox_only",
  CHROME_ONLY = "chrome_only",
  MERGE_NEWEST = "merge_newest",
  KEEP_ALL = "keep_all"
}

export enum ExtensionHandling {
  FIREFOX_EQUIVALENTS = "firefox_equivalents",
  REINSTALL_LIST = "reinstall_list",
  MANUAL_REVIEW = "manual_review"
}

// Phase 4: Extension & Tab Management Types
export interface ExtensionMasterList {
  extensions: ExtensionReinstallInfo[];
  totalFound: number;
  firefoxCompatible: number;
  requiresManualReview: number;
}

export interface ExtensionReinstallInfo {
  originalId: string;
  name: string;
  firefoxEquivalent?: FirefoxAddonInfo;
  reinstallUrl?: string;
  status: ExtensionStatus;
  dataAvailable: boolean;
  sourceProfiles: string[];
}

export interface FirefoxAddonInfo {
  id: string;
  name: string;
  slug: string;
  firefoxUrl: string;
  compatibility: CompatibilityLevel;
}

export enum ExtensionStatus {
  DIRECT_EQUIVALENT = "direct_equivalent",
  SIMILAR_ALTERNATIVE = "similar_alternative", 
  MANUAL_SEARCH_NEEDED = "manual_search_needed",
  NO_FIREFOX_EQUIVALENT = "no_firefox_equivalent"
}

export enum CompatibilityLevel {
  PERFECT = "perfect",
  GOOD = "good",
  PARTIAL = "partial",
  UNKNOWN = "unknown"
}