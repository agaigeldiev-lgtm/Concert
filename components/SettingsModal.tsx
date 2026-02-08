
import React, { useState, useEffect, useRef } from 'react';
import { StaffDirectory, Employee, NotificationSettings, User, UserRole, PhoneRecord, EquipmentCatalogItem, QuickLink, BirthdayRecord, TicketAssignmentRule, TicketType } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, TrashIcon, BellIcon, TableIcon, LifeBuoyIcon, UsersIcon, MonitorIcon, MusicIcon, TagIcon, ClockIcon, LinkIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'equipment', label: 'МФУ и оргтехника' },
  { value: 'printout', label: 'Распечатка' },
  { value: 'events', label: 'Мероприятия' },
  { value: 'computers', label: 'Компьютеры' },
  { value: 'recording', label: 'Звукозапись' },
  { value: 'procurement', label: 'Закупка' },
];

// Added missing 'security' role label to satisfy Record<UserRole, string>
const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор (всё)',
  concerts: 'События',
  parking: 'Парковка',
  it_tickets: 'IT: Создание заявок',
  it_admin: 'IT: Администрирование',
  it_inventory: 'IT: Инвентаризация',
  info: 'Инфоцентр',
  buh: 'Бухгалтерия',
  security: 'Охрана / Безопасность'
};

type SettingTab = 'system' | 'employees' | 'users' | 'infrastructure' | 'equipment' | 'it-routing' | 'content' | 'birthdays';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [phoneRecords, setPhoneRecords] = useState<PhoneRecord[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [cabinets, setCabinets] = useState<string[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayRecord[]>([]);
  const [ticketRules, setTicketRules] = useState<TicketAssignmentRule[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({ enabled: false, botToken: '', chatId: '' });
  const [users, setUsers] = useState<User[]>([]);
  
  const [activeTab, setActiveTab] = useState<SettingTab>('system');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', department: '' });
  const [newEquip, setNewEquip] = useState({ name: '', price: '' });
  const [newVenue, setNewVenue] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newCabinet, setNewCabinet] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newQuickLink, setNewQuickLink] = useState({ title: '', url: '' });
  
  // Routing state - employeeId here refers to the User ID from the registry
  const [routingForm, setRoutingForm] = useState({ type: 'computers' as TicketType, userId: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const AVAILABLE_SECTION_ROLES: UserRole[] = ['concerts', 'parking', 'it_tickets', 'it_admin', 'it_inventory', 'info', 'buh'];

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const [dir, notif, registry] = await Promise.all([
      storage.getStaffDirectory(),
      storage.getNotificationSettings(),
      storage.getUserRegistry()
    ]);
    setEmployees(dir.employees || []);
    setPhoneRecords(dir.phoneRecords || []);
    setVenues(dir.venues || []);
    setRoles(dir.roles || []);
    setDepartments(dir.departments || []);
    setCabinets(dir.cabinets || []);
    setEquipmentCatalog(dir.equipmentCatalog || []);
    setQuickLinks(dir.quickLinks || []);
    setBirthdays(dir.birthdays || []);
    setTicketRules(dir.ticketRules || []);
    setNotifications(notif);
    setUsers(registry);
  };

  if (!isOpen) return null;

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        storage.saveStaffDirectory({ employees, phoneRecords, venues, roles, departments, cabinets, equipmentCatalog, quickLinks, birthdays, ticketRules }),
        storage.saveNotificationSettings(notifications),
        storage.saveUserRegistry(users)
      ]);
      onSave();
      onClose();
    } catch (err) {
      alert('Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const addEmployee = () => {
    if (!newEmployee.name) return;
    setEmployees([...employees, { id: crypto.randomUUID(), name: newEmployee.name, phone: newEmployee.phone, department: newEmployee.department, roles: [] }]);
    setNewEmployee({ name: '', phone: '', department: '' });
  };

  const toggleEmployeeRole = (empId: string, role: string) => {
    setEmployees(employees.map(emp => {
        if (emp.id === empId) {
            const newRoles = emp.roles.includes(role) 
                ? emp.roles.filter(r => r !== role) 
                : [...emp.roles, role];
            return { ...emp, roles: newRoles };
        }
        return emp;
    }));
  };

  const addEquipment = () => {
    if (!newEquip.name || !newEquip.price) return;
    setEquipmentCatalog([...equipmentCatalog, { id: crypto.randomUUID(), name: newEquip.name, price: Number(newEquip.price) }]);
    setNewEquip({ name: '', price: '' });
  };

  const addRoutingRule = () => {
    if (!routingForm.userId) return;
    // Находим пользователя в реестре аккаунтов
    const user = users.find(u => u.id === routingForm.userId);
    if (!user) return;

    // Удаляем старое правило для этого типа, если оно есть
    const filtered = ticketRules.filter(r => r.type !== routingForm.type);
    
    const newRule: TicketAssignmentRule = {
      id: crypto.randomUUID(),
      type: routingForm.type,
      assigneeId: user.id,
      assigneeName: user.username
    };

    setTicketRules([...filtered, newRule]);
    setRoutingForm({ ...routingForm, userId: '' });
  };

  const addQuickLink = () => {
    if (!newQuickLink.title || !newQuickLink.url) return;
    setQuickLinks([...quickLinks, { id: crypto.randomUUID(), ...newQuickLink }]);
    setNewQuickLink({ title: '', url: '' });
  };

  const addRole = () => {
    if (!newRole || roles.includes(newRole)) return;
    setRoles([...roles, newRole].sort());
    setNewRole('');
  };

  const deleteItem = (setter: any, list: any[], id: string) => {
    if (confirm('Удалить запись?')) {
        setter(list.filter((i: any) => i.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[85vh] shadow-2xl flex overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[32px] animate-slide-in">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-100 dark:border-slate-800 flex flex-col no-print">
            <div className="p-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Настройки</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Панель управления</p>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {[
                    { id: 'system', label: 'Система', icon: <BellIcon className="w-4 h-4" /> },
                    { id: 'employees', label: 'Персонал', icon: <UsersIcon className="w-4 h-4" /> },
                    { id: 'users', label: 'Доступы', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> },
                    { id: 'infrastructure', label: 'Инфраструктура', icon: <TableIcon className="w-4 h-4" /> },
                    { id: 'equipment', label: 'Оборудование', icon: <MonitorIcon className="w-4 h-4" /> },
                    { id: 'it-routing', label: 'ИТ-Маршруты', icon: <LifeBuoyIcon className="w-4 h-4" /> },
                    { id: 'content', label: 'Контент', icon: <TagIcon className="w-4 h-4" /> },
                    { id: 'birthdays', label: 'Кадры (ДР)', icon: <ClockIcon className="w-4 h-4" /> },
                ].map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setActiveTab(item.id as SettingTab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <span className={activeTab === item.id ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-6 border-t dark:border-slate-800 space-y-3">
                <button onClick={handleSaveAll} disabled={isSaving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100/50 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {isSaving ? 'Сохранение...' : 'Записать изменения'}
                </button>
                <button onClick={onClose} className="w-full text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Отмена</button>
            </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar dark:bg-slate-900/50">
            
            {activeTab === 'system' && (
                <div className="space-y-10 animate-slide-in">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Уведомления</h3>
                        <p className="text-sm text-slate-400 font-medium">Связь системы с Telegram для оперативных оповещений</p>
                    </div>
                    
                    <div className="p-8 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">Включить уведомления</label>
                            <button 
                                onClick={() => setNotifications({ ...notifications, enabled: !notifications.enabled })}
                                className={`w-14 h-8 rounded-full transition-all relative ${notifications.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${notifications.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Token</label>
                                <input 
                                    type="password"
                                    value={notifications.botToken}
                                    onChange={e => setNotifications({...notifications, botToken: e.target.value})}
                                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border dark:border-slate-700 font-mono text-xs"
                                    placeholder="000000000:AA..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chat ID</label>
                                <input 
                                    value={notifications.chatId}
                                    onChange={e => setNotifications({...notifications, chatId: e.target.value})}
                                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border dark:border-slate-700 font-mono text-xs"
                                    placeholder="-100..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'employees' && (
                <div className="space-y-10 animate-slide-in">
                    <div className="flex items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Реестр сотрудников</h3>
                            <p className="text-sm text-slate-400 font-medium tracking-tight">Добавление персонала и назначение компетенций (ролей)</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px] space-y-1">
                            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">ФИО Сотрудника</label>
                            <input 
                                value={newEmployee.name}
                                onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-none font-bold text-sm uppercase" 
                                placeholder="Петров Петр Петрович"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px] space-y-1">
                            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Телефон</label>
                            <input 
                                value={newEmployee.phone}
                                onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-none font-bold text-sm" 
                                placeholder="+7..."
                            />
                        </div>
                        <button onClick={addEmployee} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Добавить</button>
                    </div>

                    <div className="border dark:border-slate-800 divide-y dark:divide-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-800/40">
                        {employees.map(emp => (
                            <div key={emp.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{emp.name}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{emp.phone}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {roles.map(role => (
                                                <button 
                                                    key={role}
                                                    onClick={() => toggleEmployeeRole(emp.id, role)}
                                                    className={`px-2 py-0.5 text-[8px] font-black uppercase border transition-all ${emp.roles.includes(role) ? 'bg-indigo-600 border-indigo-600 text-white' : 'text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteItem(setEmployees, employees, emp.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'infrastructure' && (
                <div className="space-y-12 animate-slide-in">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Инфраструктура</h3>
                        <p className="text-sm text-slate-400 font-medium">Управление кабинетами, отделами и концертными площадками</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Площадки */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Площадки</h4>
                            <div className="flex gap-2">
                                <input value={newVenue} onChange={e => setNewVenue(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs" placeholder="Новая площадка..." />
                                <button onClick={() => { if(newVenue) { setVenues([...venues, newVenue].sort()); setNewVenue(''); } }} className="p-2 bg-indigo-600 text-white rounded-lg"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {venues.map(v => (
                                    <div key={v} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-bold uppercase group">
                                        {v}
                                        <button onClick={() => setVenues(venues.filter(x => x !== v))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Отделы */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Департаменты</h4>
                            <div className="flex gap-2">
                                <input value={newDept} onChange={e => setNewDept(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs" placeholder="Новый отдел..." />
                                <button onClick={() => { if(newDept) { setDepartments([...departments, newDept].sort()); setNewDept(''); } }} className="p-2 bg-emerald-600 text-white rounded-lg"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {departments.map(d => (
                                    <div key={d} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-bold uppercase group">
                                        {d}
                                        <button onClick={() => setDepartments(departments.filter(x => x !== d))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Кабинеты */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-2">Кабинеты</h4>
                            <div className="flex gap-2">
                                <input value={newCabinet} onChange={e => setNewCabinet(e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs" placeholder="№ Каб..." />
                                <button onClick={() => { if(newCabinet) { setCabinets([...cabinets, newCabinet].sort()); setNewCabinet(''); } }} className="p-2 bg-amber-600 text-white rounded-lg"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {cabinets.map(c => (
                                    <div key={c} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-bold uppercase group">
                                        {c}
                                        <button onClick={() => setCabinets(cabinets.filter(x => x !== c))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'equipment' && (
                <div className="space-y-10 animate-slide-in">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Каталог аренды</h3>
                        <p className="text-sm text-slate-400 font-medium">Прейскурант оборудования для платных мероприятий</p>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[32px] flex items-end gap-6 border-b-8 border-indigo-600 shadow-2xl">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Наименование оборудования</label>
                            <input 
                                value={newEquip.name}
                                onChange={e => setNewEquip({...newEquip, name: e.target.value})}
                                className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-white font-bold text-sm uppercase" 
                                placeholder="Комплект звука 10кВт"
                            />
                        </div>
                        <div className="w-40 space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Цена за смену</label>
                            <input 
                                type="number"
                                value={newEquip.price}
                                onChange={e => setNewEquip({...newEquip, price: e.target.value})}
                                className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-white font-bold text-sm" 
                                placeholder="5000"
                            />
                        </div>
                        <button onClick={addEquipment} className="bg-white text-slate-900 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">Добавить</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {equipmentCatalog.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group">
                                <div className="space-y-1">
                                    <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</h5>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-black text-base tabular-nums">{item.price.toLocaleString()} ₽ <span className="text-[8px] uppercase text-slate-400 ml-1">за ед.</span></p>
                                </div>
                                <button onClick={() => deleteItem(setEquipmentCatalog, equipmentCatalog, item.id)} className="p-3 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-10 animate-slide-in">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Доступы к системе</h3>
                        <p className="text-sm text-slate-400 font-medium">Управление учетными записями и правами доступа к разделам</p>
                    </div>

                    {users.filter(u => !u.isActive).length > 0 && (
                        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-900/30 rounded-3xl space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" /> Новые заявки
                            </h4>
                            <div className="space-y-2">
                                {users.filter(u => !u.isActive).map(u => (
                                    <div key={u.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl flex items-center justify-between shadow-sm border border-amber-100 dark:border-amber-900/20">
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{u.login}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{u.department || 'Без отдела'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setUsers(users.map(user => user.id === u.id ? {...user, isActive: true} : user))} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">Активировать</button>
                                            <button onClick={() => setUsers(users.filter(user => user.id !== u.id))} className="text-rose-500 p-1.5"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {users.filter(u => u.isActive).map(u => (
                            <div key={u.id} className="p-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-indigo-600">
                                                {u.username[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{u.username}</h4>
                                                    {u.roles.includes('admin') && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-none">ROOT</span>}
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{u.department || 'Отдел не указан'}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t dark:border-slate-700">
                                            {AVAILABLE_SECTION_ROLES.map(role => (
                                                <label key={role} className="flex items-center gap-3 cursor-pointer group/label">
                                                    <div className="relative flex items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={u.roles.includes(role)} 
                                                            disabled={u.roles.includes('admin')}
                                                            onChange={() => {
                                                                const newRoles = u.roles.includes(role) ? u.roles.filter(r => r !== role) : [...u.roles, role];
                                                                setUsers(users.map(user => user.id === u.id ? {...user, roles: newRoles} : user));
                                                            }}
                                                            className="w-5 h-5 accent-indigo-600 cursor-pointer disabled:opacity-30"
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${u.roles.includes(role) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover/label:text-slate-600'}`}>
                                                        {ROLE_LABELS[role]}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => {
                                                const isAdmin = u.roles.includes('admin');
                                                const newRoles = isAdmin ? u.roles.filter(r => r !== 'admin') : [...u.roles, 'admin'];
                                                setUsers(users.map(user => user.id === u.id ? {...user, roles: newRoles} : user));
                                            }}
                                            className={`p-2 border rounded-xl transition-all ${u.roles.includes('admin') ? 'bg-indigo-600 border-indigo-600 text-white' : 'text-slate-300 border-slate-100 hover:border-indigo-400'}`}
                                            title="Права администратора"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                                        </button>
                                        <button onClick={() => deleteItem(setUsers, users, u.id)} className="p-2 border border-slate-100 hover:border-rose-200 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'it-routing' && (
                <div className="space-y-10 animate-slide-in">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">ИТ-Маршрутизация</h3>
                        <p className="text-sm text-slate-400 font-medium">Автоматическое назначение исполнителей по типам инцидентов</p>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[32px] flex flex-col md:flex-row items-end gap-6 border-b-8 border-indigo-600 shadow-2xl">
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Тип заявки</label>
                            <select 
                                value={routingForm.type}
                                onChange={e => setRoutingForm({...routingForm, type: e.target.value as TicketType})}
                                className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-white font-bold text-sm"
                            >
                                {TICKET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Назначить на аккаунт</label>
                            <select 
                                value={routingForm.userId}
                                onChange={e => setRoutingForm({...routingForm, userId: e.target.value})}
                                className="w-full px-5 py-3 bg-slate-800 border border-slate-700 text-white font-bold text-sm"
                            >
                                <option value="">Выбрать пользователя системы...</option>
                                {users.filter(u => u.isActive).map(u => (
                                    <option key={u.id} value={u.id}>{u.username} ({u.department || 'Без отдела'})</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={addRoutingRule} className="bg-white text-slate-900 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all w-full md:w-auto">
                            Добавить правило
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ticketRules.length === 0 ? (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Нет настроенных маршрутов</p>
                            </div>
                        ) : ticketRules.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl group transition-all hover:border-indigo-100">
                                <div className="space-y-1">
                                    <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                        {TICKET_TYPES.find(t => t.value === rule.type)?.label || rule.type}
                                    </h5>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        Исполнитель: {rule.assigneeName}
                                    </p>
                                </div>
                                <button onClick={() => deleteItem(setTicketRules, ticketRules, rule.id)} className="p-3 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'content' && (
                <div className="space-y-12 animate-slide-in">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Управление контентом</h3>
                        <p className="text-sm text-slate-400 font-medium">Быстрые ссылки на главной и должностные роли</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Справочник ролей */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-3 flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" /> Штатные роли (Должности)
                            </h4>
                            <div className="flex gap-2">
                                <input 
                                    value={newRole} 
                                    onChange={e => setNewRole(e.target.value)} 
                                    className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold text-xs uppercase" 
                                    placeholder="Новая роль (напр. Ведущий)..." 
                                />
                                <button onClick={addRole} className="px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl">Добавить</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {roles.map(r => (
                                    <div key={r} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-bold uppercase group transition-colors hover:border-indigo-200">
                                        {r}
                                        <button onClick={() => setRoles(roles.filter(x => x !== r))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Быстрые ссылки */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-100 pb-3 flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Быстрые ссылки дашборда
                            </h4>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Название ссылки</label>
                                    <input 
                                        value={newQuickLink.title} 
                                        onChange={e => setNewQuickLink({...newQuickLink, title: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 font-bold text-xs" 
                                        placeholder="Напр. Личный кабинет ПФР" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">URL адрес</label>
                                    <input 
                                        value={newQuickLink.url} 
                                        onChange={e => setNewQuickLink({...newQuickLink, url: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 font-mono text-xs" 
                                        placeholder="https://..." 
                                    />
                                </div>
                                <button onClick={addQuickLink} className="w-full py-3 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none">Добавить в список</button>
                            </div>
                            <div className="space-y-2">
                                {quickLinks.map(link => (
                                    <div key={link.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group hover:border-emerald-200">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white truncate">{link.title}</p>
                                            <p className="text-[9px] font-mono text-slate-400 truncate">{link.url}</p>
                                        </div>
                                        <button onClick={() => deleteItem(setQuickLinks, quickLinks, link.id)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'birthdays' && (
                <div className="space-y-10 animate-slide-in">
                    <div className="flex items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Дни рождения</h3>
                            <p className="text-sm text-slate-400 font-medium">График личных праздников для блока «Дашборд»</p>
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="file" 
                                accept=".txt,.csv" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const lines = (ev.target?.result as string).split('\n');
                                        const newBdays: BirthdayRecord[] = [];
                                        lines.forEach(l => {
                                            const [name, date, pos] = l.split(',').map(s => s.trim());
                                            if(name && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                                                newBdays.push({ id: crypto.randomUUID(), name, date, position: pos || '' });
                                            }
                                        });
                                        if(newBdays.length) {
                                            setBirthdays([...birthdays, ...newBdays]);
                                            alert(`Загружено: ${newBdays.length} записей`);
                                        }
                                    };
                                    reader.readAsText(file);
                                }} 
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Импорт .CSV</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {birthdays.map(b => (
                            <div key={b.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col gap-3 group">
                                <div className="flex justify-between items-start">
                                    <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase">{b.name}</h5>
                                    <button onClick={() => setBirthdays(birthdays.filter(x => x.id !== b.id))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{new Date(b.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[120px]">{b.position}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default SettingsModal;
