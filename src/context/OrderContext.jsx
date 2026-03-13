import { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext(null);
const STORAGE_KEY = 'ec-coffee-orders';

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

const STATUS = { inProgress: '주문 진행중', closed: '주문 마감' };

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order) => {
    const id = order.id || Date.now();
    setOrders((prev) => [{ ...order, id }, ...prev]);
    return id;
  };

  const updateOrder = (id, updates) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === Number(id) ? { ...o, ...updates } : o))
    );
  };

  const getOrder = (id) => orders.find((o) => o.id === Number(id));

  const getOpenOrderByShop = (shopName) =>
    orders.find((o) => o.shop === shopName && o.status === STATUS.inProgress);

  const clearOrders = () => setOrders([]);

  const removeOrders = (ids) => {
    const idSet = new Set(ids.map((id) => Number(id)));
    setOrders((prev) => prev.filter((o) => !idSet.has(o.id)));
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, getOrder, getOpenOrderByShop, clearOrders, removeOrders, STATUS }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}
