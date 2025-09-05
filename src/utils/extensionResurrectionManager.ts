// Extension Resurrection Manager - Master extension database with direct store links
// Provides comprehensive extension identification and reinstallation guidance

import { BrowserType } from '../types/types';

export interface ExtensionDatabase {
  id: string;
  name: string;
  description: string;
  category: string;
  chromeStoreUrl?: string;
  firefoxStoreUrl?: string;
  edgeStoreUrl?: string;
  homepage?: string;
  alternativeNames: string[];
  knownIds: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  lastUpdated: Date;
  popularity: number;
  isActive: boolean;
}

export interface DetectedExtension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
  permissions: string[];
  installDate: Date;
  updateDate?: Date;
  sourceProfile: string;
  sourceBrowser: BrowserType;
  manifestData: any;
  storeMatch?: ExtensionDatabase;
  confidence: number;
}

export interface ResurrectionPlan {
  totalExtensions: number;
  availableForInstall: number;
  deprecated: number;
  unknownExtensions: DetectedExtension[];
  installationGroups: {
    chrome: { extension: ExtensionDatabase; originalExtension: DetectedExtension }[];
    firefox: { extension: ExtensionDatabase; originalExtension: DetectedExtension }[];
    edge: { extension: ExtensionDatabase; originalExtension: DetectedExtension }[];
  };
}

export class ExtensionResurrectionManager {
  private logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void;
  private extensionDatabase: ExtensionDatabase[] = [];

  constructor(logCallback?: (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => void) {
    this.logCallback = logCallback;
    this.initializeExtensionDatabase();
  }

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
    if (this.logCallback) {
      this.logCallback(level, message, details);
    }
  }

  // Initialize comprehensive extension database
  private initializeExtensionDatabase() {
    this.log('info', 'Initializing comprehensive extension database');
    
    // Popular extensions with cross-browser store links
    this.extensionDatabase = [
      {
        id: 'ublock-origin',
        name: 'uBlock Origin',
        description: 'An efficient wide-spectrum content blocker',
        category: 'Privacy & Security',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
        firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/',
        edgeStoreUrl: 'https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odfafepnkmbhccpbejgmiehpchacaeak',
        homepage: 'https://github.com/gorhill/uBlock',
        alternativeNames: ['uBlock', 'uBlockOrigin'],
        knownIds: {
          chrome: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
          firefox: 'uBlock0@raymondhill.net',
          edge: 'odfafepnkmbhccpbejgmiehpchacaeak'
        },
        lastUpdated: new Date('2024-01-15'),
        popularity: 95,
        isActive: true
      },
      {
        id: 'adblock-plus',
        name: 'Adblock Plus',
        description: 'Block ads and pop-ups on YouTube, Facebook, Twitch, and your favorite websites',
        category: 'Privacy & Security',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/adblock-plus-free-ad-bloc/cfhdojbkjhnklbpkdaibdccddilifddb',
        firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/adblock-plus/',
        edgeStoreUrl: 'https://microsoftedge.microsoft.com/addons/detail/adblock-plus-free-ad-bl/gmgoamodcdcjnbaobigkjelfplakmdhh',
        homepage: 'https://adblockplus.org/',
        alternativeNames: ['ABP', 'Adblock+'],
        knownIds: {
          chrome: 'cfhdojbkjhnklbpkdaibdccddilifddb',
          firefox: '{d10d0bf8-f5b5-c8b4-a8b2-2b9879e08c5d}',
          edge: 'gmgoamodcdcjnbaobigkjelfplakmdhh'
        },
        lastUpdated: new Date('2024-01-10'),
        popularity: 85,
        isActive: true
      },
      {
        id: 'lastpass',
        name: 'LastPass',
        description: 'LastPass Password Manager',
        category: 'Productivity',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/lastpass-free-password-ma/hdokiejnpimakedhajhdlcegeplioahd',
        firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/lastpass-password-manager/',
        edgeStoreUrl: 'https://microsoftedge.microsoft.com/addons/detail/lastpass-free-password/bbcinlkgjjkejfdpemiealijmmooekmp',
        homepage: 'https://www.lastpass.com/',
        alternativeNames: ['LastPass Password Manager'],
        knownIds: {
          chrome: 'hdokiejnpimakedhajhdlcegeplioahd',
          firefox: 'support@lastpass.com',
          edge: 'bbcinlkgjjkejfdpemiealijmmooekmp'
        },
        lastUpdated: new Date('2024-01-05'),
        popularity: 80,
        isActive: true
      },
      {
        id: 'onetab',
        name: 'OneTab',
        description: 'Save up to 95% memory and reduce tab clutter',
        category: 'Productivity',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall',
        firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/onetab/',
        edgeStoreUrl: 'https://microsoftedge.microsoft.com/addons/detail/onetab/hoompbeepgonbkkeelpdiephbahbpcoo',
        homepage: 'https://www.one-tab.com/',
        alternativeNames: ['One Tab'],
        knownIds: {
          chrome: 'chphlpgkkbolifaimnlloiipkdnihall',
          firefox: 'extension@one-tab.com',
          edge: 'hoompbeepgonbkkeelpdiephbahbpcoo'
        },
        lastUpdated: new Date('2023-12-20'),
        popularity: 75,
        isActive: true
      },
      {
        id: 'session-buddy',
        name: 'Session Buddy',
        description: 'Manage browser sessions. Save, restore, and organize your browsing sessions',
        category: 'Productivity',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/session-buddy/edacconmaakjimmfgnblocblbcdcpbko',
        alternativeNames: ['SessionBuddy'],
        knownIds: {
          chrome: 'edacconmaakjimmfgnblocblbcdcpbko'
        },
        lastUpdated: new Date('2023-11-15'),
        popularity: 60,
        isActive: true
      },
      {
        id: 'metamask',
        name: 'MetaMask',
        description: 'An Ethereum Wallet in your Browser',
        category: 'Finance',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
        firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/',
        edgeStoreUrl: 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm',
        homepage: 'https://metamask.io/',
        alternativeNames: ['Meta Mask'],
        knownIds: {
          chrome: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
          firefox: 'webextension@metamask.io',
          edge: 'ejbalbakoplchlghecdalmeeeajnimhm'
        },
        lastUpdated: new Date('2024-01-20'),
        popularity: 70,
        isActive: true
      },
      {
        id: 'grammarly',
        name: 'Grammarly',
        description: 'Grammar Checker and Writing App',
        category: 'Productivity',
        chromeStoreUrl: 'https://chrome.google.com/webstore/detail/grammarly-grammar-checker/kbfnbcaeplbcioakkpcpgfkobkghlhen',
        firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/grammarly-1/',
        edgeStoreUrl: 'https://microsoftedge.microsoft.com/addons/detail/grammarly-grammar-checke/cnlefmmeadmemmdciolhbnfeacpdfbkd',
        homepage: 'https://www.grammarly.com/',
        alternativeNames: ['Grammar Checker'],
        knownIds: {
          chrome: 'kbfnbcaeplbcioakkpcpgfkobkghlhen',
          firefox: '87677a2c52b84ad3a151a4a72f5bd3c4@jetpack',
          edge: 'cnlefmmeadmemmdciolhbnfeacpdfbkd'
        },
        lastUpdated: new Date('2024-01-18'),
        popularity: 85,
        isActive: true
      }
    ];

    this.log('success', `Extension database initialized with ${this.extensionDatabase.length} extensions`);
  }

  // Extract extensions from browser profiles
  async extractExtensions(profiles: any[]): Promise<DetectedExtension[]> {
    this.log('info', '═══ STARTING EXTENSION EXTRACTION ═══');
    
    const allExtensions: DetectedExtension[] = [];
    
    for (const profile of profiles) {
      this.log('info', `Extracting extensions from ${profile.name} (${profile.browserType})`);
      
      try {
        const extensions = await this.extractFromProfile(profile);
        allExtensions.push(...extensions);
        this.log('success', `Extracted ${extensions.length} extensions from ${profile.name}`);
      } catch (error) {
        this.log('error', `Failed to extract extensions from ${profile.name}: ${error}`);
      }
    }

    this.log('success', `Total extensions extracted: ${allExtensions.length}`);
    return allExtensions;
  }

  // Extract extensions from individual profile
  private async extractFromProfile(profile: any): Promise<DetectedExtension[]> {
    const extensions: DetectedExtension[] = [];
    
    // Simulated extension extraction - in real implementation would parse:
    // Chrome: Extensions folder, manifest.json files
    // Firefox: extensions.json, addons database
    // Edge: Similar to Chrome structure
    
    const mockExtensions = [
      {
        id: 'ext_1',
        name: 'uBlock Origin',
        version: '1.45.0',
        enabled: true,
        description: 'An efficient wide-spectrum content blocker',
        permissions: ['activeTab', 'storage', 'unlimitedStorage'],
        installDate: new Date('2023-06-15'),
        updateDate: new Date('2024-01-10'),
        sourceProfile: profile.path,
        sourceBrowser: profile.browserType,
        manifestData: { version: '1.45.0', permissions: ['activeTab'] }
      },
      {
        id: 'ext_2', 
        name: 'LastPass',
        version: '4.95.0',
        enabled: true,
        description: 'LastPass Password Manager',
        permissions: ['storage', 'tabs', 'activeTab'],
        installDate: new Date('2023-08-20'),
        sourceProfile: profile.path,
        sourceBrowser: profile.browserType,
        manifestData: { version: '4.95.0' }
      }
    ];

    for (const ext of mockExtensions) {
      const detectedExtension: DetectedExtension = {
        ...ext,
        storeMatch: this.findStoreMatch(ext.name, ext.id),
        confidence: this.calculateMatchConfidence(ext.name, ext.id)
      };
      extensions.push(detectedExtension);
    }

    return extensions;
  }

  // Find matching extension in database
  private findStoreMatch(name: string, id: string): ExtensionDatabase | undefined {
    const normalizedName = name.toLowerCase().trim();
    
    return this.extensionDatabase.find(ext => {
      // Exact name match
      if (ext.name.toLowerCase() === normalizedName) return true;
      
      // Alternative name match
      if (ext.alternativeNames.some(alt => alt.toLowerCase() === normalizedName)) return true;
      
      // Known ID match
      if (Object.values(ext.knownIds).some(knownId => knownId === id)) return true;
      
      // Partial name match
      if (ext.name.toLowerCase().includes(normalizedName) || 
          normalizedName.includes(ext.name.toLowerCase())) return true;
      
      return false;
    });
  }

  // Calculate match confidence
  private calculateMatchConfidence(name: string, id: string): number {
    const match = this.findStoreMatch(name, id);
    if (!match) return 0;
    
    const normalizedName = name.toLowerCase().trim();
    
    // Exact name match
    if (match.name.toLowerCase() === normalizedName) return 1.0;
    
    // Known ID match
    if (Object.values(match.knownIds).some(knownId => knownId === id)) return 0.95;
    
    // Alternative name match
    if (match.alternativeNames.some(alt => alt.toLowerCase() === normalizedName)) return 0.9;
    
    // Partial match
    return 0.7;
  }

  // Create comprehensive resurrection plan
  async createResurrectionPlan(detectedExtensions: DetectedExtension[], targetBrowser: BrowserType): Promise<ResurrectionPlan> {
    this.log('info', `Creating resurrection plan for ${targetBrowser}`);
    
    const plan: ResurrectionPlan = {
      totalExtensions: detectedExtensions.length,
      availableForInstall: 0,
      deprecated: 0,
      unknownExtensions: [],
      installationGroups: {
        chrome: [],
        firefox: [],
        edge: []
      }
    };

    for (const extension of detectedExtensions) {
      if (extension.storeMatch && extension.confidence >= 0.7) {
        // Extension found in database
        plan.availableForInstall++;
        
        // Add to appropriate installation group
        if (extension.storeMatch.chromeStoreUrl) {
          plan.installationGroups.chrome.push({
            extension: extension.storeMatch,
            originalExtension: extension
          });
        }
        if (extension.storeMatch.firefoxStoreUrl) {
          plan.installationGroups.firefox.push({
            extension: extension.storeMatch,
            originalExtension: extension
          });
        }
        if (extension.storeMatch.edgeStoreUrl) {
          plan.installationGroups.edge.push({
            extension: extension.storeMatch,
            originalExtension: extension
          });
        }
        
        if (!extension.storeMatch.isActive) {
          plan.deprecated++;
        }
      } else {
        // Unknown extension
        plan.unknownExtensions.push(extension);
      }
    }

    this.log('success', `Resurrection plan created: ${plan.availableForInstall} available, ${plan.unknownExtensions.length} unknown`);
    
    return plan;
  }

  // Generate installation instructions
  generateInstallationInstructions(plan: ResurrectionPlan, targetBrowser: BrowserType): string[] {
    const instructions: string[] = [];
    
    instructions.push('🔄 EXTENSION RESURRECTION PLAN');
    instructions.push('═'.repeat(50));
    
    const targetGroup = plan.installationGroups[targetBrowser.toLowerCase() as keyof typeof plan.installationGroups];
    
    if (targetGroup && targetGroup.length > 0) {
      instructions.push(`\n📦 ${targetBrowser.toUpperCase()} EXTENSIONS (${targetGroup.length} available):`);
      
      targetGroup.forEach((item, index) => {
        const storeUrl = targetBrowser === BrowserType.FIREFOX 
          ? item.extension.firefoxStoreUrl
          : targetBrowser === BrowserType.EDGE
          ? item.extension.edgeStoreUrl
          : item.extension.chromeStoreUrl;
        
        instructions.push(`\n${index + 1}. ${item.extension.name}`);
        instructions.push(`   Original Version: ${item.originalExtension.version}`);
        instructions.push(`   Category: ${item.extension.category}`);
        instructions.push(`   Install: ${storeUrl}`);
        if (item.extension.homepage) {
          instructions.push(`   Homepage: ${item.extension.homepage}`);
        }
      });
    }

    if (plan.unknownExtensions.length > 0) {
      instructions.push(`\n❓ UNKNOWN EXTENSIONS (${plan.unknownExtensions.length} require manual search):`);
      plan.unknownExtensions.forEach((ext, index) => {
        instructions.push(`\n${index + 1}. ${ext.name} v${ext.version}`);
        instructions.push(`   Source: ${ext.sourceBrowser} - ${ext.sourceProfile}`);
        instructions.push(`   Search manually in browser store`);
      });
    }

    return instructions;
  }
}