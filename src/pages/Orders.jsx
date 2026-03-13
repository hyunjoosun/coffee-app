import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { IconBack, IconList, IconCoffee, IconHome } from '../components/Icons';

export default function Orders() {
  const { user } = useAuth();
  const { orders, clearOrders, removeOrders, isLoading, syncError } = useOrder();
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
        <p className="text-sm text-[var(--color-muted)] mb-4">로그인 후 이용하세요</p>
        <Link to="/" className="py-3 px-6 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium">로그인</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <Link to="/home" className="p-2 -ml-2 text-[var(--color-primary)]">
          <IconBack w={24} h={24} />
        </Link>
        <span className="flex-1 text-center font-semibold text-[var(--color-text)] text-sm">주문 이력</span>
        <Link to="/home" className="p-2 -mr-2 text-[var(--color-primary)]" aria-label="홈">
          <IconHome w={24} h={24} />
        </Link>
      </header>
      <div className="p-6 max-w-[360px] mx-auto">
        {isLoading && (
          <p className="text-xs text-[var(--color-muted)] mb-2">주문 목록 불러오는 중…</p>
        )}
        {syncError && (
          <p className="text-xs text-amber-600 mb-2">동기화 오류: {syncError}</p>
        )}
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-[var(--color-muted)]">지난 커피 취합 주문을 확인하세요</p>
          {orders.length > 0 && !isDeleteMode && (
            <button
              type="button"
              onClick={() => setIsDeleteMode(true)}
              className="shrink-0 text-xs text-[var(--color-muted)] underline hover:text-[var(--color-text)]"
            >
              주문 이력 삭제
            </button>
          )}
        </div>
        {isDeleteMode && (
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (selectedIds.size > 0) {
                  removeOrders(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }
                setIsDeleteMode(false);
              }}
              className="text-xs py-1.5 px-3 rounded-[var(--radius)] bg-red-100 text-red-700 font-medium disabled:opacity-50"
              disabled={selectedIds.size === 0}
            >
              선택 삭제 ({selectedIds.size})
            </button>
            <button
              type="button"
              onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()); }}
              className="text-xs py-1.5 px-3 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-muted)]"
            >
              취소
            </button>
          </div>
        )}
        <div className="space-y-2 mb-6">
          {orders.map((order) => (
            isDeleteMode ? (
              <label
                key={order.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)] hover:border-stone-300 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(order.id)) next.delete(order.id);
                      else next.add(order.id);
                      return next;
                    });
                  }}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-[var(--color-primary)] shrink-0">
                  <IconList w={20} h={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--color-text)] text-sm">{order.shop}</div>
                  <div className="text-xs text-[var(--color-muted)] mt-0.5">
                    {order.date}{order.time ? ` ${order.time}` : ''}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-muted)]">{order.status}</span>
              </label>
            ) : (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)] hover:border-stone-300 transition-colors"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-[var(--color-primary)]">
                  <IconList w={20} h={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--color-text)] text-sm">{order.shop}</div>
                  <div className="text-xs text-[var(--color-muted)] mt-0.5">
                    {order.date}{order.time ? ` ${order.time}` : ''}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-muted)]">{order.status}</span>
                <span className="text-stone-400 text-sm">›</span>
              </Link>
            )
          ))}
        </div>
        <Link
          to="/order/new"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium"
        >
          <IconCoffee w={18} h={18} />
          새 주문 시작하기
        </Link>
      </div>
    </div>
  );
}
