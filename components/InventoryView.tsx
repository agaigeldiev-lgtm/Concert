
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, EquipmentType, EquipmentStatus, StaffDirectory, User, CabinetMetadata } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, MonitorIcon, TrashIcon, EditIcon, PrinterIcon, ClockIcon, LifeBuoyIcon, ChevronLeft, ChevronRight, TableIcon, TagIcon, LinkIcon } from './Icons';

interface InventoryViewProps {
  currentUser: User;
}

const BUILDINGS = [
  { id: 'G', name: 'Главный корпус', hasMultipleFloors: true },
  { id: 'O', name: 'Второй корпус', hasMultipleFloors: false },
  { id: 'D', name: 'Филиал Демино', hasMultipleFloors: false },
  { id: 'C', name: 'Филиал Чкалова', hasMultipleFloors: false },
  { id: 'P', name: 'Первый пост', hasMultipleFloors: false },
];

const G_FLOORS = [
  { id: 'C', name: 'Цокольный' },
  { id: '1', name: '1 этаж' },
  { id: '2', name: '2 этаж' },
  { id: '3', name: '3 этаж' },
  { id: 'T', name: 'Технический' },
];

interface CartridgeType {
  id: string;
  name: string;
  printers: string;
  quantity: number;
}

interface ConsumableItem {
  id: string;
  name: string;
  type: 'chip' | 'drum' | 'other';
  quantity: number;
}

const IT_CHECKLIST_TEMPLATES = [
  {
    id: 'pc-install',
    title: 'Установка нового ПК',
    steps: [
      'Проверка комплектации и визуальный осмотр',
      'Настройка BIOS (UEFI, время, порядок загрузки)',
      'Установка ОС (Windows/Linux) и обновлений',
      'Установка драйверов (Чипсет, Видео, Сеть)',
      'Установка офисного ПО (Office, Браузеры, Архиватор)',
      'Настройка сети (IP, Домен/Группа, Hostname)',
      'Установка и обновление Антивируса',
      'Подключение периферии и проверка принтеров',
      'Создание учетной записи пользователя',
      'Маркировка (инвентарный номер, имя ПК)',
      'Подписание акта приема-передачи'
    ]
  },
  {
    id: 'printer-install',
    title: 'Настройка МФУ / Принтера',
    steps: [
      'Распаковка и снятие транспортных лент',
      'Установка картриджей и бумаги',
      'Распечатка тестовой страницы конфигурации',
      'Настройка статического IP адреса',
      'Установка драйверов на ПК пользователя',
      'Настройка сканирования (SMB/FTP/Email)',
      'Проверка качества печати и сканирования',
      'Добавление в сетевой мониторинг'
    ]
  }
];

const TYPE_LABELS: Record<EquipmentType, { label: string; icon: string; hexColor: string }> = {
  pc: { label: 'Системный блок', icon: '💻', hexColor: '#4f46e5' },
  monitor: { label: 'Монитор', icon: '🖥️', hexColor: '#2563eb' },
  laptop: { label: 'Ноутбук', icon: '💻', hexColor: '#9333ea' },
  printer: { label: 'Принтер/МФУ', icon: '🖨️', hexColor: '#059669' },
  ups: { label: 'ИБП', icon: '🔋', hexColor: '#d97706' },
  network: { label: 'Сетевое об-е', icon: '🌐', hexColor: '#7c3aed' },
  other: { label: 'Прочее', icon: '📦', hexColor: '#64748b' }
};

const STATUS_LABELS: Record<EquipmentStatus, { label: string; color: string }> = {
  working: { label: 'Исправно', color: 'bg-emerald-500 text-white shadow-emerald-500/20' },
  broken: { label: 'Неисправно', color: 'bg-rose-600 text-white shadow-rose-500/20' },
  repair: { label: 'В ремонте', color: 'bg-amber-500 text-slate-900 shadow-amber-500/20' },
  'write-off': { label: 'Списано', color: 'bg-slate-400 text-white shadow-slate-400/20' }
};

const InventoryView: React.FC<InventoryViewProps> = ({ currentUser }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);
  const [cabinetMetadata, setCabinetMetadata] = useState<Record<string, CabinetMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [addMode, setAddMode] = useState<'cartridge' | 'consumable'>('cartridge');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  
  const [activeMode, setActiveMode] = useState<'list' | 'audit' | 'naming' | 'checklists' | 'refiller'>('list');
  const [selectedCabinet, setSelectedCabinet] = useState<string>('');

  // Refiller State
  const [cartridges, setCartridges] = useState<CartridgeType[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [refillHistory, setRefillHistory] = useState<{id: string, action: string, model: string, date: string, tech: string}[]>([]);
  
  const [newCartridgeForm, setNewCartridgeForm] = useState({ name: '', printers: '' });
  const [newConsumableForm, setNewConsumableForm] = useState({ name: '', type: 'drum' as any });

  // Checklist State
  const [selectedTemplate, setSelectedTemplate] = useState(IT_CHECKLIST_TEMPLATES[0]);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  // Naming Tool State
  const [namingData, setNamingData] = useState({
    building: 'G', floor: '1', cabinet: '', pos: '01'
  });

  const canManage = currentUser.roles.some(r => r === 'admin' || r === 'it_inventory' || r === 'it_admin');

  const loadData = async () => {
    setLoading(true);
    const [inv, dir, meta] = await Promise.all([
      storage.getInventoryItems(),
      storage.getStaffDirectory(),
      storage.getCabinetMetadata()
    ]);
    setItems(inv);
    setDirectory(dir);
    setCabinetMetadata(meta);
    
    const savedRefiller = localStorage.getItem('sddt_refiller_data');
    if (savedRefiller) {
        const parsed = JSON.parse(savedRefiller);
        setCartridges(parsed.cartridges || []);
        setConsumables(parsed.consumables || []);
        setRefillHistory(parsed.history || []);
    } else {
        const defaultCarts: CartridgeType[] = [
            { id: '1', name: 'HP 285A', printers: 'P1102, M1132', quantity: 5 },
            { id: '2', name: 'Canon 725', printers: 'LBP6000', quantity: 3 }
        ];
        const defaultConsumables: ConsumableItem[] = [
            { id: 'c1', name: 'Фотобарабан HP 285A', type: 'drum', quantity: 10 }
        ];
        setCartridges(defaultCarts);
        setConsumables(defaultConsumables);
    }

    if (dir.cabinets.length > 0 && !selectedCabinet) {
        setSelectedCabinet(dir.cabinets[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
        localStorage.setItem('sddt_refiller_data', JSON.stringify({ cartridges, consumables, history: refillHistory }));
    }
  }, [cartridges, consumables, refillHistory, loading]);

  const updateCartridgeQty = (id: string, delta: number) => {
    if (!canManage) return;
    setCartridges(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c));
    const cart = cartridges.find(c => c.id === id);
    if (cart) addHistoryEntry(delta > 0 ? 'Приход' : 'Расход', cart.name);
  };

  const updateConsumableQty = (id: string, delta: number) => {
    if (!canManage) return;
    setConsumables(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c));
    const item = consumables.find(c => c.id === id);
    if (item) addHistoryEntry(delta > 0 ? 'Запчасти: Приход' : 'Запчасти: Списание', item.name);
  };

  const addHistoryEntry = (action: string, model: string) => {
    const entry = {
        id: crypto.randomUUID(),
        action, model, date: new Date().toLocaleString('ru-RU'), tech: currentUser.username
    };
    setRefillHistory(prev => [entry, ...prev.slice(0, 29)]);
  };

  const handleUpdateCabinetMeta = async (cabinet: string, updates: Partial<CabinetMetadata>) => {
    if (!canManage) return;
    const currentMeta = cabinetMetadata[cabinet] || {
        cabinet, department: '', problems: '', lastAuditDate: null, isAudited: false
    };
    const newMeta = { ...currentMeta, ...updates };
    const updatedAll = { ...cabinetMetadata, [cabinet]: newMeta };
    setCabinetMetadata(updatedAll);
    await storage.saveCabinetMetadata(updatedAll);
  };

  const hierarchicalItems = useMemo(() => {
    const q = search.toLowerCase();
    const matchedItems = items.filter(item => 
      (item.model || '').toLowerCase().includes(q) || 
      (item.invNumber || '').toLowerCase().includes(q) ||
      (item.cabinet || '').toLowerCase().includes(q) ||
      (item.responsibleName || '').toLowerCase().includes(q) ||
      (item.ipAddress && item.ipAddress.includes(q))
    );

    if (!search) {
      const roots = items.filter(i => !i.parentId);
      const children = items.filter(i => !!i.parentId);
      
      const result: (InventoryItem & { level: number })[] = [];
      roots.forEach(root => {
        result.push({ ...root, level: 0 });
        const subItems = children.filter(c => c.parentId === root.id);
        subItems.forEach(child => {
          result.push({ ...child, level: 1 });
        });
      });
      const orphanChildren = children.filter(c => !roots.find(r => r.id === c.parentId));
      orphanChildren.forEach(orphan => {
        result.push({ ...orphan, level: 0 });
      });
      return result;
    }
    return matchedItems.map(i => ({ ...i, level: 0 }));
  }, [items, search]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      broken: items.filter(i => i.status === 'broken').length,
      repair: items.filter(i => i.status === 'repair').length,
      cartridgesLow: cartridges.filter(c => c.quantity < 3).length
    };
  }, [items, cartridges]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !editingItem) return;
    const newItem: InventoryItem = {
      id: editingItem.id || crypto.randomUUID(),
      type: editingItem.type || 'pc',
      model: editingItem.model || '',
      invNumber: editingItem.invNumber || '',
      serialNumber: editingItem.serialNumber || '',
      ipAddress: editingItem.ipAddress || '',
      status: editingItem.status || 'working',
      department: editingItem.department || '',
      cabinet: editingItem.cabinet || '',
      responsibleName: editingItem.responsibleName || '',
      parentId: editingItem.parentId || undefined,
      notes: editingItem.notes || '',
      history: editingItem.history || [],
      updatedAt: new Date().toISOString()
    };
    let updatedList = editingItem.id ? items.map(i => i.id === newItem.id ? newItem : i) : [newItem, ...items];
    setItems(updatedList);
    await storage.saveInventoryItems(updatedList);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleToggleStep = (step: string) => {
    setCheckedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Удалить позицию из инвентаря?')) return;
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await storage.saveInventoryItems(updated);
  };

  const namingResult = useMemo(() => {
    const { building, floor, cabinet, pos } = namingData;
    if (!cabinet) return 'G0-000-00';
    const cabFormatted = cabinet.padStart(3, '0');
    return `${building}${floor}-${cabFormatted}-${pos}`;
  }, [namingData]);

  return (
    <div className="bg-white dark:bg-slate-950 min-h-full transition-colors duration-300 flex flex-col">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 dark:bg-slate-900/60 no-print">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
               <MonitorIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Устройств</p>
               <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ошибки / Поломки</p>
               <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.broken}</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
               <PrinterIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Мало картриджей</p>
               <h4 className={`text-2xl font-black leading-none ${stats.cartridgesLow > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{stats.cartridgesLow}</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
               <TableIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Покрытие аудита</p>
               <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{Math.round(((Object.values(cabinetMetadata) as CabinetMetadata[]).filter(m => m.isAudited).length / (directory?.cabinets.length || 1)) * 100)}%</h4>
            </div>
         </div>
      </div>

      <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print bg-white dark:bg-slate-950">
        <div className="flex items-center gap-6">
            <button onClick={() => setActiveMode('list')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeMode === 'list' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}>Реестр</button>
            <button onClick={() => setActiveMode('audit')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeMode === 'audit' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}>Обход / Аудит</button>
            <button onClick={() => setActiveMode('naming')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeMode === 'naming' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}>Имя Хоста</button>
            <button onClick={() => setActiveMode('checklists')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeMode === 'checklists' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}>Чек-листы</button>
            <button onClick={() => setActiveMode('refiller')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeMode === 'refiller' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}>Склад / Заправка</button>
        </div>
        {activeMode === 'list' && canManage && (
            <button onClick={() => { setEditingItem({ type: 'pc', status: 'working' }); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95">
                + Добавить
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeMode === 'list' && (
          <div className="p-8 space-y-6 animate-slide-in">
            <div className="flex gap-4 no-print max-w-2xl">
               <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="ПОИСК (МОДЕЛЬ, ИНВ, IP, КАБИНЕТ)..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-600 text-slate-900 dark:text-white font-mono text-xs uppercase tracking-tighter rounded-2xl"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {hierarchicalItems.map(item => {
                    const typeLabel = TYPE_LABELS[item.type] || TYPE_LABELS.other;
                    const statusLabel = STATUS_LABELS[item.status] || STATUS_LABELS.working;
                    return (
                        <div key={item.id} className={`bg-white dark:bg-slate-900/40 border p-6 rounded-[32px] group transition-all hover:border-indigo-100 dark:hover:border-indigo-500/30 flex flex-col md:flex-row md:items-center gap-6 ${item.level > 0 ? 'ml-12 border-l-4 border-l-indigo-600' : 'border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner`}>
                                    {typeLabel.icon}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">{item.model}</h3>
                                        <span className={`px-2 py-0.5 text-[7px] font-black uppercase rounded-full border border-current ${statusLabel.color}`}>
                                            {statusLabel.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><TagIcon className="w-3 h-3"/> ИНВ: <span className="text-indigo-600 dark:text-indigo-400 font-mono">{item.invNumber || '—'}</span></span>
                                        <span className="flex items-center gap-1"><TableIcon className="w-3 h-3"/> КАБ: <span className="text-slate-700 dark:text-slate-300">{item.cabinet}</span></span>
                                        {item.ipAddress && <span className="flex items-center gap-1 text-emerald-600 font-mono tracking-tighter">● {item.ipAddress}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-slate-800">
                                 <div className="text-right hidden sm:block">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ответственный</p>
                                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{item.responsibleName || 'IT ОТДЕЛ'}</p>
                                 </div>
                                 {canManage && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                 )}
                            </div>
                        </div>
                    );
                })}
                {hierarchicalItems.length === 0 && (
                    <div className="py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.2em] text-xs">Устройства не найдены</div>
                )}
            </div>
          </div>
        )}

        {activeMode === 'audit' && (
          <div className="p-8 animate-slide-in">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                   {directory?.cabinets.map(cab => {
                     const isDone = (cabinetMetadata[cab] as CabinetMetadata)?.isAudited;
                     return (
                        <button 
                            key={cab} 
                            onClick={() => setSelectedCabinet(cab)}
                            className={`w-full text-left p-6 border transition-all flex items-center justify-between rounded-2xl ${selectedCabinet === cab ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-200'}`}
                        >
                            <span className="text-sm font-black uppercase">КАБИНЕТ {cab}</span>
                            {isDone && <svg className={`w-5 h-5 ${selectedCabinet === cab ? 'text-indigo-200' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                        </button>
                     );
                   })}
                </div>

                <div className="lg:col-span-3 space-y-8">
                   {selectedCabinet ? (
                      <div className="space-y-8">
                         <div className="p-8 bg-slate-900 text-white rounded-[32px] relative overflow-hidden">
                            <h4 className="text-2xl font-black uppercase tracking-tight relative z-10">Аудит кабинета: {selectedCabinet}</h4>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">Проверка локальной инфраструктуры</p>
                            <TableIcon className="absolute right-[-20px] top-[-20px] w-64 h-64 opacity-5" />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Закрепленный отдел</label>
                                <input value={cabinetMetadata[selectedCabinet]?.department || ''} onChange={e => handleUpdateCabinetMeta(selectedCabinet, { department: e.target.value })} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-sm rounded-2xl" placeholder="Напр. Бухгалтерия" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Замечания / Проблемы</label>
                                <input value={cabinetMetadata[selectedCabinet]?.problems || ''} onChange={e => handleUpdateCabinetMeta(selectedCabinet, { problems: e.target.value })} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-sm italic rounded-2xl" placeholder="Проверить сетевой порт, заменить мышь..." />
                            </div>
                         </div>
                         
                         <button 
                            onClick={() => handleUpdateCabinetMeta(selectedCabinet, { isAudited: !cabinetMetadata[selectedCabinet]?.isAudited, lastAuditDate: new Date().toISOString() })}
                            className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl ${cabinetMetadata[selectedCabinet]?.isAudited ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-slate-500/20'}`}
                         >
                            {cabinetMetadata[selectedCabinet]?.isAudited ? 'АУДИТ ЗАВЕРШЕН' : 'ОТМЕТИТЬ КАК ПРОВЕРЕННЫЙ'}
                         </button>
                      </div>
                   ) : (
                      <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed border-slate-50 dark:border-slate-900 rounded-[40px] text-center p-12">
                         <TableIcon className="w-16 h-16 text-slate-100 dark:text-slate-900 mb-6" />
                         <p className="text-slate-300 dark:text-slate-800 font-black uppercase tracking-[0.3em] text-sm">ВЫБЕРИТЕ КАБИНЕТ ДЛЯ ПРОВЕРКИ</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeMode === 'refiller' && (
          <div className="p-8 space-y-10 animate-slide-in">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Склад расходных материалов</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Учет картриджей и запчастей</p>
                </div>
                {canManage && (
                    <button onClick={() => setIsAddTypeOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-500/20">
                        Регистрация SKU
                    </button>
                )}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {cartridges.map(cart => (
                            <div key={cart.id} className={`p-8 bg-white dark:bg-slate-900/40 border rounded-[32px] transition-all hover:shadow-2xl ${cart.quantity < 3 ? 'border-rose-500/50 bg-rose-50/10' : 'border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">{cart.name}</h5>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cart.printers}</p>
                                    </div>
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${cart.quantity < 3 ? 'bg-rose-600 border-rose-400 text-white animate-pulse' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
                                        <span className="text-2xl font-black">{cart.quantity}</span>
                                        <span className="text-[7px] font-black uppercase">Шт.</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => updateCartridgeQty(cart.id, -1)} disabled={!canManage || cart.quantity <= 0} className="py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-black hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30">−</button>
                                    <button onClick={() => updateCartridgeQty(cart.id, 1)} disabled={!canManage} className="py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl font-black hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30">+</button>
                                </div>
                                {cart.quantity < 3 && <p className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest text-center">Критический остаток!</p>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[40px] flex flex-col overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">История операций</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 divide-y divide-slate-50 dark:divide-slate-800">
                        {refillHistory.map(log => (
                            <div key={log.id} className="p-4 space-y-2 group">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${log.action.includes('Расход') ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {log.action}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600">{log.date}</span>
                                </div>
                                <h6 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-tight">{log.model}</h6>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{log.tech}</p>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
        )}

        {activeMode === 'naming' && (
          <div className="max-w-2xl mx-auto p-8 space-y-10 animate-slide-in">
             <div className="p-10 bg-slate-900 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 text-center space-y-6">
                    <h3 className="text-3xl font-black uppercase tracking-tight">Генератор имен хоста</h3>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="bg-white/10 px-4 py-2 border border-white/10 font-mono text-4xl font-black tracking-widest rounded-xl">{namingResult}</div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(namingResult); alert('Имя хоста скопировано'); }} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Скопировать в буфер</button>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-5"><MonitorIcon className="w-64 h-64" /></div>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Корпус</label>
                    <select value={namingData.building} onChange={e => setNamingData({...namingData, building: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-black text-xs uppercase rounded-2xl">
                         {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Этаж</label>
                    <select value={namingData.floor} onChange={e => setNamingData({...namingData, floor: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-black text-xs uppercase rounded-2xl">
                         {G_FLOORS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
             </div>
          </div>
        )}

        {activeMode === 'checklists' && (
           <div className="max-w-3xl mx-auto p-8 animate-slide-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
                 <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{selectedTemplate.title}</h4>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Регламент выполнения работ</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-slate-900 dark:text-white leading-none">{Object.values(checkedSteps).filter(Boolean).length}<span className="text-slate-300">/</span>{selectedTemplate.steps.length}</div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Шагов выполнено</span>
                    </div>
                 </div>
                 <div className="p-10 grid grid-cols-1 gap-4">
                    {selectedTemplate.steps.map((step, idx) => (
                        <button key={idx} onClick={() => handleToggleStep(step)} className={`flex items-center gap-5 p-6 text-left border rounded-[28px] transition-all group ${checkedSteps[step] ? 'bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-50 dark:border-slate-800 hover:border-indigo-400'}`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm transition-all ${checkedSteps[step] ? 'bg-white text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700'}`}>
                                {checkedSteps[step] ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg> : idx + 1}
                            </div>
                            <span className={`text-sm font-black uppercase tracking-tight leading-tight ${checkedSteps[step] ? 'text-white line-through opacity-80' : 'text-slate-700 dark:text-slate-300'}`}>{step}</span>
                        </button>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/98 backdrop-blur-xl">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[48px] animate-slide-in">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Учет оборудования
                    </h2>
                    <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="p-3 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-all rounded-full"><PlusIcon className="w-8 h-8 rotate-45" /></button>
                </div>
                <form onSubmit={handleSave} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Тип устройства</label>
                            <select value={editingItem?.type} onChange={e => setEditingItem({...editingItem!, type: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white rounded-2xl">
                                {Object.entries(TYPE_LABELS).map(([val, {label}]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Статус</label>
                            <select value={editingItem?.status} onChange={e => setEditingItem({...editingItem!, status: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white rounded-2xl">
                                {Object.entries(STATUS_LABELS).map(([val, {label}]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Модель / Название</label>
                        <input required value={editingItem?.model || ''} onChange={e => setEditingItem({...editingItem!, model: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sm uppercase text-slate-900 dark:text-white rounded-2xl" placeholder="Напр. Dell Latitude 5520" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IP Адрес</label>
                            <input value={editingItem?.ipAddress || ''} onChange={e => setEditingItem({...editingItem!, ipAddress: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm uppercase text-indigo-600 dark:text-indigo-400 rounded-2xl" placeholder="192.168.1.100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Инвентарный №</label>
                            <input value={editingItem?.invNumber || ''} onChange={e => setEditingItem({...editingItem!, invNumber: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black font-mono text-sm uppercase text-slate-900 dark:text-white rounded-2xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Кабинет</label>
                            <select value={editingItem?.cabinet} onChange={e => setEditingItem({...editingItem!, cabinet: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white rounded-2xl">
                                <option value="">—</option>
                                {directory?.cabinets.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Отдел</label>
                            <select value={editingItem?.department} onChange={e => setEditingItem({...editingItem!, department: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white rounded-2xl">
                                <option value="">—</option>
                                {directory?.departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-10 py-4 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest transition-colors hover:text-slate-900 dark:hover:text-white">Отмена</button>
                        <button type="submit" className="bg-indigo-600 text-white px-16 py-4 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all rounded-2xl">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
