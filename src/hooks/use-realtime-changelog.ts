"use client";

import { useState, useEffect, useCallback } from 'react';
import { RealtimeChangelogEntry, RealtimeChangelogStats } from '@/lib/realtime-changelog';

interface UseRealtimeChangelogOptions {
  userFacingOnly?: boolean;
  limit?: number;
}

interface UseRealtimeChangelogReturn {
  entries: RealtimeChangelogEntry[];
  loading: boolean;
  error: Error | null;
  stats: RealtimeChangelogStats;
  addEntry: (entry: Omit<RealtimeChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<RealtimeChangelogEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

export function useRealtimeChangelog(options: UseRealtimeChangelogOptions = {}): UseRealtimeChangelogReturn {
  const { userFacingOnly = true, limit = 50 } = options;
  const [entries, setEntries] = useState<RealtimeChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/changelog/realtime?userFacing=${userFacingOnly}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch changelog entries');
      }
      
      const data = await response.json();
      setEntries(data.entries || []);
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching changelog entries:', err);
      setError(err as Error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [userFacingOnly, limit]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats: RealtimeChangelogStats = {
    total: entries.length,
    byType: entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byImpact: entries.reduce((acc, entry) => {
      acc[entry.impact] = (acc[entry.impact] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recent: entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length,
  };

  const addEntry = useCallback(async (entry: Omit<RealtimeChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/changelog/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add changelog entry');
      }
      
      await fetchEntries();
    } catch (err) {
      console.error('Error adding changelog entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<RealtimeChangelogEntry>) => {
    try {
      const response = await fetch(`/api/changelog/realtime/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update changelog entry');
      }
      
      await fetchEntries();
    } catch (err) {
      console.error('Error updating changelog entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/changelog/realtime/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete changelog entry');
      }
      
      await fetchEntries();
    } catch (err) {
      console.error('Error deleting changelog entry:', err);
      throw err;
    }
  }, [fetchEntries]);

  const refresh = useCallback(async () => {
    await fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    stats,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh,
    isConnected,
  };
}


