import { FirefoxProfile, ComparisonData } from '../types/types';

export class ProfileAnalysisService {
  async analyzeProfile(profile: FirefoxProfile): Promise<{
    bookmarkCount: number;
    historyCount: number;
    passwordCount: number;
    cookieCount: number;
    extensionCount: number;
    preferenceCount: number;
  }> {
    // In a real implementation, this would read the actual SQLite databases
    // For web environment, we'd need a SQLite WASM library or server-side processing
    
    try {
      // Simulate analysis based on profile size and type
      const sizeMB = profile.size / (1024 * 1024);
      const multiplier = this.getProfileMultiplier(profile.profileType);
      
      return {
        bookmarkCount: Math.floor((sizeMB * 2.5) * multiplier.bookmarks),
        historyCount: Math.floor((sizeMB * 45) * multiplier.history),
        passwordCount: Math.floor((sizeMB * 0.8) * multiplier.passwords),
        cookieCount: Math.floor((sizeMB * 12) * multiplier.cookies),
        extensionCount: Math.floor((sizeMB * 0.15) * multiplier.extensions),
        preferenceCount: Math.floor((sizeMB * 3.2) * multiplier.preferences)
      };
    } catch (error) {
      console.error('Profile analysis failed:', error);
      return {
        bookmarkCount: 0,
        historyCount: 0,
        passwordCount: 0,
        cookieCount: 0,
        extensionCount: 0,
        preferenceCount: 0
      };
    }
  }

  private getProfileMultiplier(profileType: string): {
    bookmarks: number;
    history: number;
    passwords: number;
    cookies: number;
    extensions: number;
    preferences: number;
  } {
    switch (profileType) {
      case 'developer':
        return {
          bookmarks: 1.5,
          history: 2.0,
          passwords: 1.2,
          cookies: 1.8,
          extensions: 3.0,
          preferences: 2.5
        };
      case 'nightly':
        return {
          bookmarks: 1.2,
          history: 1.5,
          passwords: 1.0,
          cookies: 1.3,
          extensions: 2.0,
          preferences: 2.0
        };
      case 'default-release':
        return {
          bookmarks: 1.0,
          history: 1.0,
          passwords: 1.0,
          cookies: 1.0,
          extensions: 1.0,
          preferences: 1.0
        };
      default:
        return {
          bookmarks: 0.8,
          history: 0.9,
          passwords: 0.7,
          cookies: 0.8,
          extensions: 0.6,
          preferences: 0.9
        };
    }
  }

  async compareProfiles(profile1: FirefoxProfile, profile2: FirefoxProfile): Promise<ComparisonData> {
    try {
      const analysis1 = await this.analyzeProfile(profile1);
      const analysis2 = await this.analyzeProfile(profile2);
      
      const bookmarks = this.calculateSimilarity(analysis1.bookmarkCount, analysis2.bookmarkCount);
      const history = this.calculateSimilarity(analysis1.historyCount, analysis2.historyCount);
      const passwords = this.calculateSimilarity(analysis1.passwordCount, analysis2.passwordCount);
      const cookies = this.calculateSimilarity(analysis1.cookieCount, analysis2.cookieCount);
      const extensions = this.calculateSimilarity(analysis1.extensionCount, analysis2.extensionCount);
      const preferences = this.calculateSimilarity(analysis1.preferenceCount, analysis2.preferenceCount);
      
      // Calculate overall similarity score
      const weights = {
        bookmarks: 0.25,
        history: 0.20,
        passwords: 0.20,
        cookies: 0.10,
        extensions: 0.15,
        preferences: 0.10
      };
      
      const similarityScore = 
        bookmarks.similarity * weights.bookmarks +
        history.similarity * weights.history +
        passwords.similarity * weights.passwords +
        cookies.similarity * weights.cookies +
        extensions.similarity * weights.extensions +
        preferences.similarity * weights.preferences;
      
      return {
        bookmarks,
        history,
        passwords,
        cookies,
        extensions,
        preferences,
        similarityScore
      };
    } catch (error) {
      console.error('Profile comparison failed:', error);
      throw new Error('Failed to compare profiles. Please try again.');
    }
  }

  private calculateSimilarity(count1: number, count2: number): {
    count1: number;
    count2: number;
    similarity: number;
    difference: number;
    common?: number;
    uniqueTo1?: number;
    uniqueTo2?: number;
  } {
    if (count1 === 0 && count2 === 0) {
      return {
        count1,
        count2,
        similarity: 1.0,
        difference: 0,
        common: 0,
        uniqueTo1: 0,
        uniqueTo2: 0
      };
    }
    
    if (count1 === 0 || count2 === 0) {
      return {
        count1,
        count2,
        similarity: 0.0,
        difference: Math.abs(count1 - count2),
        common: 0,
        uniqueTo1: count1,
        uniqueTo2: count2
      };
    }
    
    // Estimate overlap based on profile characteristics
    const minCount = Math.min(count1, count2);
    const maxCount = Math.max(count1, count2);
    const similarity = minCount / maxCount;
    
    // Estimate common items (this would be calculated from actual data)
    const estimatedCommon = Math.floor(minCount * similarity);
    
    return {
      count1,
      count2,
      similarity,
      difference: Math.abs(count1 - count2),
      common: estimatedCommon,
      uniqueTo1: count1 - estimatedCommon,
      uniqueTo2: count2 - estimatedCommon
    };
  }

  async validateProfile(profilePath: string): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    try {
      // In a real implementation, this would check actual files
      // For web environment, we need to work with File System Access API
      
      if ('showDirectoryPicker' in window) {
        // Modern browser with File System Access API
        // This would be implemented to actually check files
        return {
          isValid: true,
          issues: [],
          warnings: []
        };
      } else {
        warnings.push('Cannot fully validate profile - File System Access API not available');
        return {
          isValid: true,
          issues: [],
          warnings
        };
      }
    } catch (error) {
      issues.push('Profile validation failed');
      return {
        isValid: false,
        issues,
        warnings
      };
    }
  }
}