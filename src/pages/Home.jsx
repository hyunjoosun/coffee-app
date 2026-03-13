import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCoffee, IconList, IconUsers } from '../components/Icons';

export default function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;

  const links = [
    { to: '/order/new', label: '커피 취합 시작하기', Icon: IconCoffee },
    { to: '/orders', label: '주문 이력 보기', Icon: IconList },
    { to: '/team', label: '팀원 관리', Icon: IconUsers },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-6 pt-16 pb-10">
      <div className="max-w-[360px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary text-white">
            <IconCoffee w={22} h={22} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">내가 쏜다 커피</h1>
            <p className="text-sm text-[var(--color-muted)]">{user.name}님, 안녕하세요</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {links.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)] hover:border-stone-300 transition-colors group"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-[var(--color-primary)] group-hover:bg-stone-200 transition-colors">
                <Icon w={20} h={20} />
              </span>
              <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
              <span className="ml-auto text-stone-400 text-sm">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
