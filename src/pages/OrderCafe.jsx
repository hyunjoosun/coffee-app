import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useCafe } from '../context/CafeContext';
import { useOrder } from '../context/OrderContext';
import { IconBack, IconCheck, IconPencil, IconXCircle, IconImage, IconImageOff, IconHome } from '../components/Icons';

const NONE_CHOICE = 'none';
const TAB = { menu: 'menu', status: 'status' };

export default function OrderCafe() {
  const { user } = useAuth();
  const { members } = useTeam();
  const { getCafe, addMenu, updateMenu, deleteMenu, updateCafeMenuImage } = useCafe();
  const { addOrder, updateOrder, getOpenOrderByShop, orders, STATUS } = useOrder();
  const { cafeId } = useParams();
  const cafe = getCafe(cafeId);

  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [ordererId, setOrdererId] = useState(() => {
    if (!user?.id) return '';
    const exists = members.some((m) => m.id === user.id);
    return exists ? String(user.id) : '';
  });
  const [activeTab, setActiveTab] = useState(TAB.menu);
  const [selections, setSelections] = useState({});
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [addMenuName, setAddMenuName] = useState('');
  const [addMenuPrice, setAddMenuPrice] = useState('');
  const [addMenuTemp, setAddMenuTemp] = useState('');
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);
  const [completeMessageType, setCompleteMessageType] = useState('success');
  const [showSelectOrdererFirst, setShowSelectOrdererFirst] = useState(false);
  const [showEditMenus, setShowEditMenus] = useState(false);
  const [editModalMenuId, setEditModalMenuId] = useState(null);
  const [showMenuImageModal, setShowMenuImageModal] = useState(false);
  const [requests, setRequests] = useState({});
  const menuImageInputRef = useRef(null);
  const createdOrderForCafeRef = useRef(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
        <Link to="/" className="py-3 px-6 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium">로그인</Link>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6">
        <p className="text-sm text-[var(--color-muted)] mb-4">카페를 찾을 수 없습니다</p>
        <Link to="/order/new" className="py-2 px-4 rounded-[var(--radius)] bg-gradient-primary text-sm">카페 선택으로</Link>
      </div>
    );
  }

  useEffect(() => {
    if (!cafe?.name) return;
    const open = getOpenOrderByShop(cafe.name);
    if (open) {
      createdOrderForCafeRef.current = null;
      createdOrderForCafeRef.currentId = null;
      setCurrentOrderId(open.id);
      setSelections(open.selections || {});
      setRequests(open.requests || {});
      return;
    }
    if (createdOrderForCafeRef.current === cafe.name && createdOrderForCafeRef.currentId != null) {
      setCurrentOrderId(createdOrderForCafeRef.currentId);
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const id = Date.now();
    addOrder({
      id,
      date: dateStr,
      time: timeStr,
      shop: cafe.name,
      status: STATUS.inProgress,
      count: 0,
      items: [],
      selections: {},
      requests: {},
    });
    createdOrderForCafeRef.current = cafe.name;
    createdOrderForCafeRef.currentId = id;
    setCurrentOrderId(id);
  }, [cafe?.name]);

  useEffect(() => {
    if (currentOrderId == null) return;
    const count = members.filter((m) => selections[m.id] != null).length;
    updateOrder(currentOrderId, { selections, requests, count });
  }, [currentOrderId, selections, requests, members.length]);

  const setChoiceForOrderer = (value) => {
    if (!ordererId) {
      setShowSelectOrdererFirst(true);
      return;
    }
    setShowSelectOrdererFirst(false);
    setSelections((prev) => ({ ...prev, [ordererId]: value }));
  };

  const handleAddMenuSubmit = () => {
    if (!addMenuName.trim()) return;
    const price = addMenuPrice.trim() ? Number(addMenuPrice.replace(/,/g, '')) : undefined;
    const priceVal = Number.isNaN(price) ? undefined : price;
    if (editModalMenuId != null) {
      updateMenu(cafe.id, editModalMenuId, { name: addMenuName.trim(), price: priceVal, temp: addMenuTemp || undefined });
    } else {
      addMenu(cafe.id, { name: addMenuName.trim(), price: priceVal, temp: addMenuTemp || undefined });
    }
    closeAddMenuModal();
  };

  const closeAddMenuModal = () => {
    setShowAddMenuModal(false);
    setEditModalMenuId(null);
    setAddMenuName('');
    setAddMenuPrice('');
    setAddMenuTemp('');
  };

  const openEditMenuModal = (menu) => {
    setAddMenuName(menu.name);
    setAddMenuPrice(menu.price != null ? String(menu.price) : '');
    setAddMenuTemp(menu.temp || '');
    setEditModalMenuId(menu.id);
    setShowAddMenuModal(true);
  };

  const handleDeleteMenu = (menuId) => {
    deleteMenu(cafe.id, menuId);
    setSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key] === String(menuId)) delete next[key];
      });
      return next;
    });
  };

  const getChoiceLabel = (value) => {
    if (!value) return '미선택';
    if (value === NONE_CHOICE) return '안마실래요';
    const menu = cafe.menus.find((m) => m.id === Number(value));
    if (!menu) return '미선택';
    return menu.temp ? `${menu.name} (${menu.temp})` : menu.name;
  };

  const handleMenuImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCafeMenuImage(cafe.id, reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectedOrdererChoice = ordererId ? selections[ordererId] : null;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pb-8">
      <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <Link to="/order/new" className="p-2 -ml-2 text-[var(--color-primary)]">
          <IconBack w={24} h={24} />
        </Link>
        <span className="flex-1 text-center font-semibold text-[var(--color-text)] text-sm truncate">{cafe.name}</span>
        <Link to="/home" className="p-2 -mr-2 text-[var(--color-primary)]" aria-label="홈">
          <IconHome w={24} h={24} />
        </Link>
      </header>

      <div className="p-6 max-w-[360px] mx-auto space-y-6">
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-2">주문자 선택</label>
          <select
            value={ordererId}
            onChange={(e) => { setOrdererId(e.target.value); setShowSelectOrdererFirst(false); }}
            className="w-full px-4 py-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">선택하세요</option>
            {members.map((m) => (
              <option key={m.id} value={String(m.id)}>{m.name}</option>
            ))}
          </select>
          {showSelectOrdererFirst && (
            <p className="mt-1.5 text-xs text-red-600">주문자를 먼저 선택하세요</p>
          )}
        </div>

        <div className="flex rounded-[var(--radius)] bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab(TAB.menu)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === TAB.menu ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow)]' : 'text-[var(--color-muted)]'
            }`}
          >
            메뉴 선택
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TAB.status)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === TAB.status ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow)]' : 'text-[var(--color-muted)]'
            }`}
          >
            주문 현황
          </button>
        </div>

        {activeTab === TAB.menu && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] p-4 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex flex-nowrap shrink-0">
                {cafe.menuImage ? (
                  <button
                    type="button"
                    onClick={() => setShowMenuImageModal(true)}
                    className="py-1.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] text-xs font-medium hover:bg-stone-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <IconImage w={14} h={14} />
                    메뉴판 보기
                  </button>
                ) : (
                  <>
                    <input
                      ref={menuImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMenuImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => menuImageInputRef.current?.click()}
                      className="py-1.5 px-3 rounded-lg border border-[var(--color-border)] bg-stone-50 text-[var(--color-muted)] text-xs hover:bg-stone-100 hover:border-stone-300 flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <IconImageOff w={14} h={14} />
                      등록된 메뉴판 없음
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-nowrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setEditModalMenuId(null); setAddMenuName(''); setAddMenuPrice(''); setAddMenuTemp(''); setShowAddMenuModal(true); }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap ${
                    showAddMenuModal ? 'bg-[var(--color-border)] text-[var(--color-primary)] border border-[var(--color-primary)]' : 'bg-gradient-primary text-white '
                  }`}
                >
                  메뉴 등록
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditMenus((v) => !v)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap border ${
                    showEditMenus ? 'bg-[var(--color-border)] text-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                  }`}
                >
                  {showEditMenus ? '완료' : '수정'}
                </button>
              </div>
            </div>
            <span className="block text-sm font-medium text-[var(--color-text)] mb-2">메뉴를 선택하세요</span>
            <div className="flex flex-col gap-2">
              {cafe.menus.map((menu) =>
                showEditMenus ? (
                  <div
                    key={menu.id}
                    className="flex justify-between items-center py-2.5 px-4 rounded-[var(--radius)] text-sm font-medium border border-[var(--color-border)] bg-[var(--color-card)]"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="truncate">
                        {menu.name}
                        {menu.temp && <span className="text-[var(--color-muted)]"> ({menu.temp})</span>}
                      </span>
                      {menu.price != null && <span className="shrink-0 text-[var(--color-muted)]">{Number(menu.price).toLocaleString()}원</span>}
                    </div>
                    <div className="shrink-0 flex items-center gap-0.5 ml-2">
                      <button
                        type="button"
                        onClick={() => openEditMenuModal(menu)}
                        className="p-2 rounded text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-primary)]"
                        title="수정"
                      >
                        <IconPencil w={14} h={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="p-2 rounded text-[var(--color-muted)] hover:bg-red-100 hover:text-red-600"
                        title="삭제"
                      >
                        <IconXCircle w={14} h={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setChoiceForOrderer(String(menu.id))}
                    className={`w-full flex justify-between items-center py-2.5 px-4 rounded-[var(--radius)] text-sm font-medium border transition-colors text-left ${
                      selectedOrdererChoice === String(menu.id)
                        ? 'bg-gradient-primary text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-stone-50'
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      {menu.name}
                      {menu.temp && (
                        <span className={selectedOrdererChoice === String(menu.id) ? 'opacity-90' : 'text-[var(--color-muted)]'}> ({menu.temp})</span>
                      )}
                    </span>
                    {menu.price != null && (
                      <span className={`shrink-0 ml-2 ${selectedOrdererChoice === String(menu.id) ? 'opacity-90' : 'text-[var(--color-muted)]'}`}>
                        {Number(menu.price).toLocaleString()}원
                      </span>
                    )}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setChoiceForOrderer(NONE_CHOICE)}
                className={`w-full flex justify-between items-center py-2.5 px-4 rounded-[var(--radius)] text-sm font-medium border transition-colors text-left ${
                  selectedOrdererChoice === NONE_CHOICE
                    ? 'bg-gradient-primary text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-stone-50'
                }`}
              >
                <span>안마실래요</span>
              </button>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5">요청사항 (선택)</label>
              <input
                type="text"
                placeholder="예: 얼음 적게, 휘핑 없이"
                value={ordererId ? (requests[ordererId] ?? '') : ''}
                onChange={(e) => {
                  if (!ordererId) return;
                  setRequests((prev) => ({ ...prev, [ordererId]: e.target.value }));
                }}
                disabled={!ordererId}
                className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!ordererId) {
                  setCompleteMessageType('need_orderer');
                  setShowCompleteMessage(true);
                  return;
                }
                if (!selections[ordererId]) {
                  setCompleteMessageType('need_menu');
                  setShowCompleteMessage(true);
                  return;
                }
                const rawItems = members
                  .filter((m) => selections[m.id] && selections[m.id] !== NONE_CHOICE)
                  .map((m) => {
                    const menu = cafe.menus.find((me) => me.id === Number(selections[m.id]));
                    const request = requests[m.id]?.trim() || undefined;
                    return {
                      name: menu?.name ?? '',
                      options: menu?.temp ?? '',
                      count: 1,
                      orderedBy: m.name,
                      price: menu?.price != null ? Number(menu.price) : undefined,
                      request,
                    };
                  });
                const merged = {};
                rawItems.forEach((it) => {
                  const requestKey = it.request ?? '';
                  const key = `${it.name}|${it.options ?? ''}|${requestKey}`;
                  if (!merged[key]) merged[key] = { name: it.name, options: it.options ?? '', count: 0, orderedByList: [], price: it.price != null ? Number(it.price) : undefined, request: it.request };
                  merged[key].count += 1;
                  merged[key].orderedByList.push(it.orderedBy);
                  if (it.price != null) merged[key].price = Number(it.price);
                });
                const items = Object.values(merged);
                const totalCount = items.reduce((s, it) => s + it.count, 0);
                const allSelected = members.every((m) => selections[m.id] != null);
                if (currentOrderId != null) {
                  updateOrder(currentOrderId, {
                    items,
                    count: totalCount,
                    status: allSelected ? STATUS.closed : STATUS.inProgress,
                  });
                  if (allSelected) setCurrentOrderId(null);
                }
                setCompleteMessageType('success');
                setShowCompleteMessage(true);
              }}
              className="w-full mt-4 py-3.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium flex items-center justify-center gap-2"
            >
              <IconCheck w={18} h={18} />
              선택완료
            </button>
          </div>
        )}

        {showAddMenuModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={closeAddMenuModal}>
            <div className="w-full max-w-[320px] rounded-[var(--radius-lg)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-md)]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{editModalMenuId != null ? '메뉴 수정' : '메뉴 등록'}</h3>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">메뉴 이름</label>
                  <input
                    type="text"
                    placeholder="예: 아메리카노"
                    value={addMenuName}
                    onChange={(e) => setAddMenuName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">가격 (원)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="예: 4500"
                    value={addMenuPrice}
                    onChange={(e) => setAddMenuPrice(e.target.value.replace(/[^0-9,]/g, ''))}
                    className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5">ICE / HOT</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMenuTemp('ICE')}
                      className={`flex-1 py-2.5 rounded-[var(--radius)] text-sm font-medium border ${
                        addMenuTemp === 'ICE' ? 'bg-gradient-primary text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                      }`}
                    >
                      ICE
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMenuTemp('HOT')}
                      className={`flex-1 py-2.5 rounded-[var(--radius)] text-sm font-medium border ${
                        addMenuTemp === 'HOT' ? 'bg-gradient-primary text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                      }`}
                    >
                      HOT
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={closeAddMenuModal} className="flex-1 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium">
                  취소
                </button>
                <button type="button" onClick={handleAddMenuSubmit} className="flex-1 py-2.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium">
                  {editModalMenuId != null ? '수정' : '등록'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {showMenuImageModal && cafe.menuImage && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowMenuImageModal(false)}>
            <div className="relative max-w-full max-h-[90vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img src={cafe.menuImage} alt="메뉴판" className="max-w-full max-h-[85vh] object-contain rounded-[var(--radius-lg)] shadow-lg bg-[var(--color-card)]" />
              <button
                type="button"
                onClick={() => setShowMenuImageModal(false)}
                className="mt-3 w-full max-w-[200px] py-2.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium"
              >
                닫기
              </button>
            </div>
          </div>,
          document.body
        )}

        {showCompleteMessage && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50">
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-card)] p-6 max-w-xs w-full text-center shadow-[var(--shadow-md)]">
              {completeMessageType === 'success' ? (
                <>
                  <span className="flex justify-center mb-3">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-border)] text-[var(--color-primary)]">
                      <IconCheck w={24} h={24} />
                    </span>
                  </span>
                  <p className="text-[var(--color-text)] font-medium mb-4">주문이 완료되었습니다</p>
                </>
              ) : (
                <p className="text-[var(--color-text)] font-medium mb-4">
                  {completeMessageType === 'need_orderer' ? '주문자를 먼저 선택하세요' : '메뉴를 선택하세요'}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowCompleteMessage(false)}
                className="w-full py-2.5 rounded-[var(--radius)] bg-gradient-primary text-sm font-medium"
              >
                확인
              </button>
            </div>
          </div>,
          document.body
        )}

        {activeTab === TAB.status && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-card)] border border-[var(--color-border)] p-4 shadow-[var(--shadow)]">
            <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide mb-3">주문 현황</h3>
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="py-2 border-b border-[var(--color-border)] last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[var(--color-text)] text-sm">{member.name}</span>
                    <span className="text-sm text-[var(--color-muted)]">{getChoiceLabel(selections[member.id])}</span>
                  </div>
                  {requests[member.id]?.trim() && (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">요청사항 : {requests[member.id].trim()}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          to={currentOrderId != null ? `/orders/${currentOrderId}` : (orders.length > 0 ? `/orders/${orders[0].id}` : '/orders')}
          className="mt-4 w-full py-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] text-sm font-medium hover:bg-stone-50 flex items-center justify-center gap-2"
        >
          주문취합보기
        </Link>
      </div>
    </div>
  );
}
