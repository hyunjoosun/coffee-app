import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCafe } from '../context/CafeContext';
import { IconBack, IconStore, IconPlus, IconHome } from '../components/Icons';

export default function OrderNew() {
  const { user } = useAuth();
  const { cafes, addCafe, removeCafes } = useCafe();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [newCafeName, setNewCafeName] = useState('');
  const [menuImageFile, setMenuImageFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
        <p className="text-sm text-[var(--color-muted)] mb-4">로그인 후 이용하세요</p>
        <Link to="/" className="py-3 px-6 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium">
          로그인
        </Link>
      </div>
    );
  }

  const handleAddCafe = () => {
    if (!newCafeName.trim()) return;
    if (menuImageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        addCafe(newCafeName.trim(), reader.result);
        setNewCafeName('');
        setMenuImageFile(null);
        setShowAddForm(false);
      };
      reader.readAsDataURL(menuImageFile);
    } else {
      addCafe(newCafeName.trim());
      setNewCafeName('');
      setMenuImageFile(null);
      setShowAddForm(false);
    }
  };

  const clearAddForm = () => {
    setShowAddForm(false);
    setNewCafeName('');
    setMenuImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <Link to="/home" className="p-2 -ml-2 text-[var(--color-primary)]">
          <IconBack w={24} h={24} />
        </Link>
        <span className="flex-1 text-center font-semibold text-[var(--color-text)] text-sm">커피 취합 시작하기</span>
        <Link to="/home" className="p-2 -mr-2 text-[var(--color-primary)]" aria-label="홈">
          <IconHome w={24} h={24} />
        </Link>
      </header>
      <div className="p-6 max-w-[360px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-[var(--color-muted)]">카페를 선택하세요</p>
          {cafes.length > 0 && !isDeleteMode && (
            <button
              type="button"
              onClick={() => setIsDeleteMode(true)}
              className="shrink-0 text-xs text-[var(--color-muted)] underline hover:text-[var(--color-text)]"
            >
              카페 삭제
            </button>
          )}
        </div>
        {isDeleteMode && (
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (selectedIds.size > 0) {
                  removeCafes(Array.from(selectedIds));
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
        <div className="space-y-2 mb-4">
          {cafes.map((cafe) => (
            isDeleteMode ? (
              <label
                key={cafe.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)] hover:border-stone-300 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(cafe.id)}
                  onChange={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(cafe.id)) next.delete(cafe.id);
                      else next.add(cafe.id);
                      return next;
                    });
                  }}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-[var(--color-primary)] shrink-0">
                  <IconStore w={20} h={20} />
                </span>
                <span className="font-medium text-[var(--color-text)] text-sm">{cafe.name}</span>
              </label>
            ) : (
              <button
                key={cafe.id}
                type="button"
                onClick={() => navigate(`/order/cafe/${cafe.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] text-left shadow-[var(--shadow)] hover:border-stone-300 transition-colors"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 text-[var(--color-primary)]">
                  <IconStore w={20} h={20} />
                </span>
                <span className="font-medium text-[var(--color-text)] text-sm">{cafe.name}</span>
                <span className="ml-auto text-stone-400 text-sm">›</span>
              </button>
            )
          ))}
        </div>

        {showAddForm ? (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow)]">
            <input
              type="text"
              placeholder="카페 이름"
              value={newCafeName}
              onChange={(e) => setNewCafeName(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <div className="mb-3">
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5">메뉴판 이미지 (선택)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setMenuImageFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-[var(--color-text)] file:mr-2 file:py-2 file:px-3 file:rounded-[var(--radius)] file:border-0 file:text-sm file:font-medium file:bg-gradient-primary file:text-white file:cursor-pointer"
              />
              {menuImageFile && (
                <p className="mt-1 text-xs text-[var(--color-muted)]">{menuImageFile.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearAddForm}
                className="flex-1 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddCafe}
                className="flex-1 py-2.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium"
              >
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
