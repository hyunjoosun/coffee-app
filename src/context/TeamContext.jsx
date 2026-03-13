import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const TeamContext = createContext(null);
const STORAGE_KEY = 'ec-coffee-team-members';

const OLD_DEFAULT_NAMES = new Set(['김철수', '이영희', '박민수']);

function loadMembersFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const names = new Set(parsed.map((m) => m?.name).filter(Boolean));
        if (names.size === OLD_DEFAULT_NAMES.size && [...names].every((n) => OLD_DEFAULT_NAMES.has(n))) {
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        return parsed;
      }
    }
  } catch (_) {}
  return [];
}

function rowToMember(row) {
  return { id: row.id, name: row.name };
}

export function TeamProvider({ children }) {
  const [members, setMembers] = useState(loadMembersFromStorage);
  const [isLoading, setIsLoading] = useState(isSupabaseEnabled());

  const fetchMembers = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setMembers((data ?? []).map(rowToMember));
    } catch (err) {
      console.error('Supabase fetch team_members:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    fetchMembers();

    const channel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMember = rowToMember(payload.new);
            setMembers((prev) => (prev.some((m) => m.id === newMember.id) ? prev : [...prev, newMember]));
          } else if (payload.eventType === 'UPDATE') {
            setMembers((prev) =>
              prev.map((m) => (m.id === payload.new.id ? rowToMember(payload.new) : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMembers((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchMembers]);

  useEffect(() => {
    if (!isSupabaseEnabled()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    }
  }, [members]);

  const addMember = async (name) => {
    if (!name?.trim()) return;
    const id = Date.now();
    const member = { id, name: name.trim() };

    if (supabase) {
      const { error } = await supabase.from('team_members').insert({ id, name: name.trim() });
      if (error) console.error('Supabase add member:', error);
    }
    setMembers((prev) => [...prev, member]);
  };

  const removeMember = async (id) => {
    if (supabase) {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) console.error('Supabase remove member:', error);
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <TeamContext.Provider value={{ members, addMember, removeMember, isLoading: isSupabaseEnabled() ? isLoading : false }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
