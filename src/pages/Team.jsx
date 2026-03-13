import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { IconBack, IconUser, IconPlus, IconHome } from '../components/Icons';

export default function Team() {
  const { members, addMember, removeMember } = useTeam();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMember(newName.trim());
    setNewName('');
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setNewName('');
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <Link to="/home" className="p-2 -ml-2 text-[var(--color-primary)]">
          <IconBack w={24} h={24} />
        </Link>
        <span className="flex-1 text-center font-semibold text-[var(--color-text)] text-sm">팀원 관리</span>
        <Link to="/home" className="p-2 -mr-2 text-[var(--color-primary)]" aria-label="홈">
          <IconHome w={24} h={24} />
        </Link>
      </header>
      <div className="p-6 max-w-[360px] mx-auto">
        <p className="text-sm text-[var(--color-muted)] mb-4">함께 커피 취합할 팀원을 관리하세요</p>
        <div className="space-y-2 mb-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)]"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-[var(--color-primary)]">
                <IconUser w={20} h={20} />
              </span>
              <span className="font-medium text-[var(--color-text)] text-sm flex-1">{m.name}</span>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                className="shrink-0 py-1.5 px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        {showAddForm ? (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)]">
            <h3 className="font-medium text-[var(--color-text)] text-sm mb-3">팀원 추가</h3>
            <input
              type="text"
              placeholder="이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleCancel} className="flex-1 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium">
                취소
              </button>
              <button type="button" onClick={handleAdd} className="flex-1 py-2.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium">
                등록
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-lg)] bg-gradient-primary text-sm font-medium"
          >
            <IconPlus w={18} h={18} />
            추가
          </button>
        )}
      </div>
    </div>
  );
}
