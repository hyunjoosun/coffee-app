import { createContext, useContext, useState, useEffect } from 'react';

const TeamContext = createContext(null);

const STORAGE_KEY = 'ec-coffee-team-members';

const OLD_DEFAULT_NAMES = new Set(['김철수', '이영희', '박민수']);

function loadMembers() {
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

export function TeamProvider({ children }) {
  const [members, setMembers] = useState(loadMembers);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const addMember = (name) => {
    if (!name?.trim()) return;
    setMembers((prev) => [...prev, { id: Date.now(), name: name.trim() }]);
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <TeamContext.Provider value={{ members, addMember, removeMember }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
