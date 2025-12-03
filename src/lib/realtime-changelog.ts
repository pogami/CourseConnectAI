/**
 * Realtime Changelog Types and Utilities
 */

export interface RealtimeChangelogEntry {
  id: string;
  date: string;
  version: string;
  type: 'bugfix' | 'enhancement' | 'feature' | 'breaking' | 'security' | 'performance' | 'documentation';
  impact: 'low' | 'medium' | 'high' | 'critical';
  author: string;
  changes: string[];
  userFacing?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RealtimeChangelogStats {
  total: number;
  byType: Record<string, number>;
  byImpact: Record<string, number>;
  recent: number;
}

/**
 * Realtime Changelog Manager
 * Handles changelog entries (can be extended to use Firestore or other storage)
 */
export class RealtimeChangelogManager {
  /**
   * Get all changelog entries
   */
  static async getAllEntries(): Promise<RealtimeChangelogEntry[]> {
    // Placeholder - can be extended to fetch from Firestore or API
    return [];
  }

  /**
   * Get user-facing changelog entries only
   */
  static async getUserFacingEntries(): Promise<RealtimeChangelogEntry[]> {
    const allEntries = await this.getAllEntries();
    return allEntries.filter(entry => entry.userFacing !== false);
  }

  /**
   * Add a new changelog entry
   */
  static async addEntry(entry: Omit<RealtimeChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Placeholder - can be extended to save to Firestore or API
    const id = `changelog-${Date.now()}`;
    return id;
  }

  /**
   * Update an existing changelog entry
   */
  static async updateEntry(id: string, updates: Partial<RealtimeChangelogEntry>): Promise<void> {
    // Placeholder - can be extended to update in Firestore or API
  }

  /**
   * Delete a changelog entry
   */
  static async deleteEntry(id: string): Promise<void> {
    // Placeholder - can be extended to delete from Firestore or API
  }
}


