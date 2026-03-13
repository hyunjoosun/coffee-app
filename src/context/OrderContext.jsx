import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const OrderContext = createContext(null);
const STORAGE_KEY = 'ec-coffee-orders';

function loadOrdersFromStorage() {
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

function rowToOrder(row) {
  return {
    id: row.id,
    date: row.date,
    time: row.time ?? undefined,
    shop: row.shop,
    status: row.status,
    count: row.count ?? 0,
    items: row.items ?? [],
    selections: row.selections ?? {},
    requests: row.requests ?? {},
  };
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(loadOrdersFromStorage);
  const [isLoading, setIsLoading] = useState(isSupabaseEnabled());
  const [syncError, setSyncError] = useState(null);

  // Supabase에서 주문 목록 불러오기
  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    setSyncError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      setOrders((data ?? []).map(rowToOrder));
    } catch (err) {
      console.error('Supabase fetch orders:', err);
      setSyncError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    fetchOrders();

    // Realtime: 다른 사용자가 추가/수정/삭제한 주문 반영
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = rowToOrder(payload.new);
            setOrders((prev) => (prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => {
                if (o.id !== payload.new.id) return o;
                const updated = rowToOrder(payload.new);
                // payload에 items가 비어 오는 경우 기존 items 유지 (상세에서 내용 안 나오는 현상 방지)
                const items = (updated.items?.length ? updated.items : o.items) ?? [];
                return { ...updated, items };
              })
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Supabase 미사용 시: localStorage 동기화 (기존 동작 유지)
  useEffect(() => {
    if (!isSupabaseEnabled()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  const addOrder = async (order) => {
    const id = order.id || Date.now();
    const row = {
      id,
      date: order.date,
      time: order.time ?? null,
      shop: order.shop,
      status: order.status,
      count: order.count ?? 0,
      items: order.items ?? [],
      selections: order.selections ?? {},
      requests: order.requests ?? {},
    };

    if (supabase) {
      setSyncError(null);
      const { error } = await supabase.from('orders').insert(row);
      if (error) {
        console.error('Supabase add order:', error);
        setSyncError(error.message);
        setOrders((prev) => [{ ...order, id }, ...prev]);
        return id;
      }
      setOrders((prev) => [{ ...order, id }, ...prev]);
    } else {
      setOrders((prev) => [{ ...order, id }, ...prev]);
    }
    return id;
  };

  const updateOrder = async (id, updates) => {
    const numId = Number(id);
    if (supabase) {
      setSyncError(null);
      const { error } = await supabase
        .from('orders')
        .update({
          ...(updates.date !== undefined && { date: updates.date }),
          ...(updates.time !== undefined && { time: updates.time }),
          ...(updates.shop !== undefined && { shop: updates.shop }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.count !== undefined && { count: updates.count }),
          ...(updates.items !== undefined && { items: updates.items }),
          ...(updates.selections !== undefined && { selections: updates.selections }),
          ...(updates.requests !== undefined && { requests: updates.requests }),
        })
        .eq('id', numId);
      if (error) {
        console.error('Supabase update order:', error);
        setSyncError(error.message);
      }
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === numId ? { ...o, ...updates } : o))
    );
  };

  const getOrder = (id) => orders.find((o) => o.id === Number(id));

  const getOpenOrderByShop = (shopName) =>
    orders.find((o) => o.shop === shopName && o.status === STATUS.inProgress);

  const clearOrders = () => {
    if (supabase) {
      setSyncError(null);
      supabase
        .from('orders')
        .delete()
        .then(({ error }) => {
          if (error) {
            console.error('Supabase clear orders:', error);
            setSyncError(error.message);
          }
        });
    }
    setOrders([]);
  };

  const removeOrders = async (ids) => {
    const idSet = new Set(ids.map((id) => Number(id)));
    if (supabase) {
      setSyncError(null);
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', Array.from(idSet));
      if (error) {
        console.error('Supabase remove orders:', error);
        setSyncError(error.message);
      }
    }
    setOrders((prev) => prev.filter((o) => !idSet.has(o.id)));
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        getOrder,
        getOpenOrderByShop,
        clearOrders,
        removeOrders,
        STATUS,
        isLoading: isSupabaseEnabled() ? isLoading : false,
        syncError: isSupabaseEnabled() ? syncError : null,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}
