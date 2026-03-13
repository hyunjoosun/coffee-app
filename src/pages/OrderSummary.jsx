import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { IconBack, IconHome } from '../components/Icons';

export default function OrderSummary() {
  const { user } = useAuth();
  const { id } = useParams();
  const { getOrder } = useOrder();
  const order = getOrder(id);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
        <Link to="/" className="py-3 px-6 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium">로그인</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
        <p className="text-sm text-[var(--color-muted)] mb-4">주문을 찾을 수 없습니다</p>
        <Link to="/orders" className="py-2 px-4 rounded-[var(--radius)] bg-gradient-primary text-sm">주문 이력으로</Link>
      </div>
    );
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const mergedItems = (() => {
    const map = {};
    orderItems.forEach((item) => {
      const names = item.orderedByList?.length === item.count
        ? item.orderedByList
        : (item.orderedBy ? Array(item.count).fill(item.orderedBy) : []);
      const requestKey = item.request ?? '';
      const key = `${item.name}|${item.options ?? ''}|${requestKey}`;
      if (!map[key]) map[key] = { name: item.name, options: item.options ?? '', count: 0, orderedByList: [], price: item.price != null ? Number(item.price) : undefined, request: item.request };
      map[key].count += item.count;
      map[key].orderedByList.push(...names);
      if (item.price != null) map[key].price = Number(item.price);
    });
    return Object.values(map);
  })();

  const totalAmount = mergedItems.reduce((sum, it) => sum + (it.price != null && !Number.isNaN(Number(it.price)) ? Number(it.price) * it.count : 0), 0);
  const hasAnyPrice = mergedItems.some((it) => it.price != null && !Number.isNaN(Number(it.price)));

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <Link to="/orders" className="p-2 -ml-2 text-[var(--color-primary)]">
          <IconBack w={24} h={24} />
        </Link>
        <span className="flex-1 text-center font-semibold text-[var(--color-text)] text-sm">주문 요약</span>
        <Link to="/home" className="p-2 -mr-2 text-[var(--color-primary)]" aria-label="홈">
          <IconHome w={24} h={24} />
        </Link>
      </header>
      <div className="p-6 max-w-[360px] mx-auto">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow)] mb-6">
          <div className="px-4 py-4 border-b border-[var(--color-border)]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[var(--color-text)]">{order.shop}</span>
              <span className="text-xs text-[var(--color-primary-deep)] px-2 py-0.5 rounded-full bg-[var(--color-border)]">{order.status}</span>
            </div>
            <div className="text-sm text-[var(--color-muted)] mt-1">
            {order.date}{order.time ? ` ${order.time}` : ''} · 총 {order.count}잔
          </div>
          </div>
          <div className="px-4 py-4">
            <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide mb-3">주문 메뉴</div>
            <ul className="space-y-3">
              {mergedItems.map((item, i) => (
                <li key={i} className="flex justify-between items-start text-sm">
                  <div>
                    <span className="text-[var(--color-text)]">{item.name}</span>
                    {item.options && <span className="text-[var(--color-muted)]"> ({item.options})</span>}
                    {item.orderedByList?.length > 0 && (
                      <span className="block text-xs text-[var(--color-muted)] mt-0.5">→ {item.orderedByList.join(', ')}</span>
                    )}
                    {item.request && (
                      <span className="block text-xs text-[var(--color-muted)] mt-0.5">요청사항 : {item.request}</span>
                    )}
                  </div>
                  <span className="text-[var(--color-muted)] shrink-0">{item.count}잔</span>
                </li>
              ))}
            </ul>
            <div className="px-4 pt-3 mt-3 border-t border-[var(--color-border)] flex justify-between items-center text-sm">
              <span className="font-medium text-[var(--color-text)]">총 주문 금액</span>
              <span className="font-semibold text-[var(--color-text)]">
                {hasAnyPrice ? `${totalAmount.toLocaleString()}원` : '-'}
              </span>
            </div>
          </div>
        </div>
        <Link
          to="/orders"
          className="block w-full py-3 text-center rounded-[var(--radius)] bg-gradient-primary text-sm font-medium"
        >
          주문 이력으로
        </Link>
      </div>
    </div>
  );
}
