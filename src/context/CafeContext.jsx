import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const CafeContext = createContext(null);
const STORAGE_KEY = 'ec-coffee-cafes';

const OLD_DEFAULT_CAFE_NAMES = new Set(['스타벅스 강남점', '이디야 역삼점', '투썸 신논현점']);

function loadCafesFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const names = new Set(parsed.map((c) => c?.name).filter(Boolean));
        if (names.size === OLD_DEFAULT_CAFE_NAMES.size && [...names].every((n) => OLD_DEFAULT_CAFE_NAMES.has(n))) {
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }
        return parsed.map((c) => ({ ...c, menuImage: c.menuImage ?? null }));
      }
    }
  } catch (_) {}
  return [];
}

function rowToCafe(row) {
  return {
    id: row.id,
    name: row.name,
    menus: row.menus ?? [],
    menuImage: row.menu_image ?? null,
  };
}

export function CafeProvider({ children }) {
  const [cafes, setCafes] = useState(loadCafesFromStorage);
  const [isLoading, setIsLoading] = useState(isSupabaseEnabled());

  const fetchCafes = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setCafes((data ?? []).map(rowToCafe));
    } catch (err) {
      console.error('Supabase fetch cafes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    fetchCafes();

    const channel = supabase
      .channel('cafes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cafes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCafe = rowToCafe(payload.new);
            setCafes((prev) => (prev.some((c) => c.id === newCafe.id) ? prev : [...prev, newCafe]));
          } else if (payload.eventType === 'UPDATE') {
            setCafes((prev) =>
              prev.map((c) => (c.id === payload.new.id ? rowToCafe(payload.new) : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setCafes((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchCafes]);

  useEffect(() => {
    if (!isSupabaseEnabled()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cafes));
    }
  }, [cafes]);

  const addCafe = async (name, menuImage = null) => {
    if (!name?.trim()) return;
    const id = Date.now();
    const cafe = { id, name: name.trim(), menus: [], menuImage };

    if (supabase) {
      const { error } = await supabase.from('cafes').insert({
        id,
        name: name.trim(),
        menus: [],
        menu_image: menuImage,
      });
      if (error) {
        console.error('Supabase add cafe:', error);
      }
    }
    setCafes((prev) => [...prev, cafe]);
  };

  const removeCafes = async (ids) => {
    const idSet = new Set(ids.map((id) => Number(id)));
    if (supabase) {
      const { error } = await supabase.from('cafes').delete().in('id', Array.from(idSet));
      if (error) console.error('Supabase remove cafes:', error);
    }
    setCafes((prev) => prev.filter((c) => !idSet.has(c.id)));
  };

  const addMenu = (cafeId, menu) => {
    const name = typeof menu === 'string' ? menu : menu?.name;
    if (!name?.trim()) return;
    const price = typeof menu === 'object' && menu != null && 'price' in menu ? menu.price : undefined;
    const temp = typeof menu === 'object' && menu != null && 'temp' in menu ? menu.temp : undefined;
    const newMenu = { id: Date.now(), name: name.trim(), price, temp };

    setCafes((prev) => {
      const next = prev.map((c) =>
        c.id === cafeId ? { ...c, menus: [...c.menus, newMenu] } : c
      );
      const cafe = next.find((c) => c.id === cafeId);
      if (supabase && cafe) {
        supabase.from('cafes').update({ menus: cafe.menus }).eq('id', cafeId).then(({ error }) => {
          if (error) console.error('Supabase add menu:', error);
        });
      }
      return next;
    });
  };

  const updateMenu = (cafeId, menuId, updates) => {
    const name = typeof updates === 'string' ? updates : updates?.name;
    if (name !== undefined && !name?.trim()) return;

    setCafes((prev) => {
      const next = prev.map((c) =>
        c.id === cafeId
          ? {
              ...c,
              menus: c.menus.map((m) => {
                if (m.id !== menuId) return m;
                if (typeof updates === 'string') return { ...m, name: updates.trim() };
                const price = updates?.price !== undefined ? updates.price : m.price;
                const temp = updates?.temp !== undefined ? updates.temp : m.temp;
                return { ...m, name: updates?.name?.trim() ?? m.name, price, temp };
              }),
            }
          : c
      );
      const cafe = next.find((c) => c.id === cafeId);
      if (supabase && cafe) {
        supabase.from('cafes').update({ menus: cafe.menus }).eq('id', cafeId).then(({ error }) => {
          if (error) console.error('Supabase update menu:', error);
        });
      }
      return next;
    });
  };

  const deleteMenu = (cafeId, menuId) => {
    setCafes((prev) => {
      const next = prev.map((c) =>
        c.id === cafeId ? { ...c, menus: c.menus.filter((m) => m.id !== menuId) } : c
      );
      const cafe = next.find((c) => c.id === cafeId);
      if (supabase && cafe) {
        supabase.from('cafes').update({ menus: cafe.menus }).eq('id', cafeId).then(({ error }) => {
          if (error) console.error('Supabase delete menu:', error);
        });
      }
      return next;
    });
  };

  const getCafe = (cafeId) => cafes.find((c) => c.id === Number(cafeId));

  const updateCafeMenuImage = (cafeId, menuImage) => {
    setCafes((prev) => {
      const next = prev.map((c) => (c.id === cafeId ? { ...c, menuImage } : c));
      if (supabase) {
        supabase.from('cafes').update({ menu_image: menuImage }).eq('id', cafeId).then(({ error }) => {
          if (error) console.error('Supabase update menu image:', error);
        });
      }
      return next;
    });
  };

  return (
    <CafeContext.Provider
      value={{
        cafes,
        addCafe,
        removeCafes,
        addMenu,
        updateMenu,
        deleteMenu,
        getCafe,
        updateCafeMenuImage,
        isLoading: isSupabaseEnabled() ? isLoading : false,
      }}
    >
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  const ctx = useContext(CafeContext);
  if (!ctx) throw new Error('useCafe must be used within CafeProvider');
  return ctx;
}
