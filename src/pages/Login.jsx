import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { IconUser } from '../components/Icons';

export default function Login() {
  const { login } = useAuth();
  const { members } = useTeam();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('');

  const handleLogin = () => {
    const member = members.find((m) => m.id === Number(selectedId));
    if (member && login(member)) {
      navigate('/home', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-surface)]">
      <div className="w-full max-w-[320px]">
        <div className="flex justify-center mb-6">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary">
            <IconUser w={28} h={28} />
          </span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text)] text-center mb-1">로그인</h1>
        <p className="text-sm text-[var(--color-muted)] text-center mb-6">팀원을 선택하세요</p>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-4 py-3.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">팀원 선택</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLogin}
            className="flex-1 py-3.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium transition-colors"
          >
            로그인
          </button>
          <Link
            to="/team"
            className="flex-1 py-3.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] text-sm font-medium text-center hover:bg-stone-50 transition-colors flex items-center justify-center"
          >
            팀원 추가
          </Link>
        </div>
      </div>
    </div>
  );
}
