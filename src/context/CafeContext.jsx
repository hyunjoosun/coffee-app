import { createContext, useContext, useState, useEffect } from 'react';

const CafeContext = createContext(null);
const STORAGE_KEY = 'ec-coffee-cafes';

const OLD_DEFAULT_CAFE_NAMES = new Set(['스타벅스 강남점', '이디야 역삼점', '투썸 신논현점']);

function loadCafes() {
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

export function CafeProvider({ children }) {
  const [cafes, setCafes] = useState(loadCafes);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cafes));
  }, [cafes]);

  const addCafe = (name, menuImage = null) => {
    if (!name?.trim()) return;
    setCafes((prev) => [...prev, { id: Date.now(), name: name.trim(), menus: [], menuImage }]);
  };

  const removeCafes = (ids) => {
    const idSet = new Set(ids.map((id) => Number(id)));
    setCafes((prev) => prev.filter((c) => !idSet.has(c.id)));
  };

  const addMenu = (cafeId, menu) => {
    const name = typeof menu === 'string' ? menu : menu?.name;
    if (!name?.trim()) return;
    const price = typeof menu === 'object' && menu != null && 'price' in menu ? menu.price : undefined;
    const temp = typeof menu === 'object' && menu != null && 'temp' in menu ? menu.temp : undefined;
    setCafes((prev) =>
      prev.map((c) =>
        c.id === cafeId
          ? { ...c, menus: [...c.menus, { id: Date.now(), name: name.trim(), price, temp }] }
          : c
      )
    );
  };

  const updateMenu = (cafeId, menuId, updates) => {
    const name = typeof updates === 'string' ? updates : updates?.name;
    if (name !== undefined && !name?.trim()) return;
    setCafes((prev) =>
      prev.map((c) =>
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
      )
    );
  };

  const deleteMenu = (cafeId, menuId) => {
    setCafes((prev) =>
      prev.map((c) =>
        c.id === cafeId ? { ...c, menus: c.menus.filter((m) => m.id !== menuId) } : c
      )
    );
  };

  const getCafe = (cafeId) => cafes.find((c) => c.id === Number(cafeId));

  const updateCafeMenuImage = (cafeId, menuImage) => {
    setCafes((prev) =>
      prev.map((c) => (c.id === cafeId ? { ...c, menuImage } : c))
    );
  };

  return (
    <CafeContext.Provider value={{ cafes, addCafe, removeCafes, addMenu, updateMenu, deleteMenu, getCafe, updateCafeMenuImage }}>
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  const ctx = useContext(CafeContext);
  if (!ctx) throw new Error('useCafe must be used within CafeProvider');
  return ctx;
}
