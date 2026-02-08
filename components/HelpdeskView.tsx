
import React, { useState, useEffect, useMemo } from 'react';
import { HelpdeskTicket, TicketStatus, TicketPriority, TicketType, User, StaffDirectory } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, LifeBuoyIcon, TrashIcon, ClockIcon, MonitorIcon, MusicIcon, PrinterIcon, TableIcon, EditIcon } from './Icons';

interface HelpdeskViewProps {
  currentUser: User;
}

const TICKET_TYPES: { value: TicketType; label: string; icon: React.ReactNode; color: string; hex: string }[] = [
  { value: 'equipment', label: 'МФУ и оргтехника', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', hex: '#2563eb' },
  { value: 'printout', label: 'Распечатка', icon: <PrinterIcon className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', hex: '#059669' },
  { value: 'events', label: 'Мероприятия', icon: <MusicIcon className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', hex: '#9333ea' },
  { value: 'computers', label: 'Компьютеры', icon: <MonitorIcon className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20', hex: '#4f46e5' },
  { value: 'recording', label: 'Звукозапись', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20', hex: '#e11d48' },
  { value: 'procurement', label: 'Закупка', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', hex: '#d97706' },
];

const HelpdeskView: React.FC<HelpdeskViewProps> = ({ currentUser }) => {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [filterType, setFilterType] = useState<TicketType | 'all'>('all');
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);

  const [newTicket, setNewTicket] = useState<Partial<HelpdeskTicket>>({ 
    subject: '', 
    description: '', 
    priority: 'medium',
    type: 'computers',
    department: '',
    cabinet: '',
    equipmentAction: 'repair',
    eventSound: false,
    eventLight: false,
    eventScreen: false,
    printType: 'bw',
    printPages: '1'
  });

  const canExecute = currentUser.roles.some(r => r === 'admin' || r === 'it_admin');
  const canCreate = currentUser.roles.some(r => r === 'admin' || r === 'it_tickets' || r === 'it_admin');

  const loadData = async () => {
    setLoading(true);
    const [ticketsData, dirData] = await Promise.all([
      storage.getHelpdeskTickets(),
      storage.getStaffDirectory()
    ]);
    setTickets(ticketsData);
    setDirectory(dirData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'new' || t.status === 'in-progress').length;
    const closed = total - open;
    
    const byType = TICKET_TYPES.map(type => ({
      ...type,
      count: tickets.filter(t => t.type === type.value).length,
      percent: total > 0 ? Math.round((tickets.filter(t => t.type === type.value).length / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    return { total, open, closed, byType };
  }, [tickets]);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let subject = newTicket.subject || '';
    if (newTicket.type === 'equipment') {
      subject = `${newTicket.equipmentAction === 'repair' ? 'Ремонт' : 'Заправка'} ${newTicket.equipmentModel || 'МФУ'}`;
    } else if (newTicket.type === 'procurement') {
      subject = `Закупка: ${newTicket.procurementItem || 'предмет'}`;
    } else if (newTicket.type === 'printout') {
      subject = `Распечатка: ${newTicket.printPages} стр. (${newTicket.printType === 'bw' ? 'Ч/Б' : 'Цвет'})`;
    }

    const rule = directory?.ticketRules?.find(r => r.type === newTicket.type);

    const ticket: HelpdeskTicket = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      username: currentUser.username,
      subject: subject,
      description: newTicket.description || '',
      status: 'new',
      priority: newTicket.priority || 'medium',
      type: newTicket.type || 'computers',
      department: newTicket.department || '',
      cabinet: newTicket.cabinet || '',
      assignedToId: rule?.assigneeId,
      assignedToName: rule?.assigneeName,
      internalNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [ticket, ...tickets];
    setTickets(updated);
    await storage.saveHelpdeskTickets(updated);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTicket({ 
      subject: '', description: '', priority: 'medium', type: 'computers',
      department: currentUser.department || directory?.departments[0] || '', 
      cabinet: directory?.cabinets[0] || '',
      equipmentAction: 'repair', printType: 'bw', printPages: '1'
    });
  };

  const handleUpdateStatus = async (id: string, status: TicketStatus) => {
    if (!canExecute) return;
    const updated = tickets.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t);
    setTickets(updated);
    await storage.saveHelpdeskTickets(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить заявку?')) return;
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    await storage.saveHelpdeskTickets(updated);
  };

  const filteredTickets = useMemo(() => {
    let result = [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filterType !== 'all') result = result.filter(t => t.type === filterType);
    if (!canExecute) result = result.filter(t => t.userId === currentUser.id);
    return result;
  }, [tickets, filterType, canExecute, currentUser.id]);

  const getPriorityInfo = (p: TicketPriority) => {
    switch (p) {
      case 'critical': return { label: 'КРИТИЧНО', style: 'bg-rose-600 text-white animate-pulse' };
      case 'high': return { label: 'ВЫСОКИЙ', style: 'bg-orange-500 text-white' };
      case 'medium': return { label: 'ОБЫЧНЫЙ', style: 'bg-amber-400 text-slate-900' };
      case 'low': return { label: 'НИЗКИЙ', style: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
      default: return { label: 'ОБЫЧНЫЙ', style: 'bg-amber-400 text-slate-900' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-full transition-colors duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <LifeBuoyIcon className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Служба Поддержки</h2>
          </div>
          <div className="flex items-center gap-6 pt-2">
            <button 
                onClick={() => setActiveTab('list')}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'list' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}
            >
                {canExecute ? 'Все заявки' : 'Мои заявки'}
            </button>
            {canExecute && (
              <button 
                  onClick={() => setActiveTab('stats')}
                  className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'stats' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600'}`}
              >
                  Статистика IT
              </button>
            )}
          </div>
        </div>
        {canCreate && (
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 active:scale-95">
            <PlusIcon className="w-5 h-5" /> Новая заявка
          </button>
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="flex flex-col h-full">
          <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 overflow-x-auto no-scrollbar sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
            <button onClick={() => setFilterType('all')} className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest border transition-all ${filterType === 'all' ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800'}`}>Все системы</button>
            {TICKET_TYPES.map(type => (
              <button key={type.value} onClick={() => setFilterType(type.value)} className={`flex items-center gap-2 px-5 py-2 text-[9px] font-black uppercase tracking-widest border transition-all ${filterType === type.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800'}`}>
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {loading ? (
              <div className="py-20 text-center text-slate-300 dark:text-slate-800 animate-pulse font-black uppercase tracking-widest">Загрузка данных...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-[40px] flex flex-col items-center">
                <LifeBuoyIcon className="w-16 h-16 text-slate-100 dark:text-slate-900 mb-6" />
                <p className="text-slate-400 dark:text-slate-700 font-black uppercase tracking-[0.2em] text-sm">Активных инцидентов нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredTickets.map(ticket => {
                  const typeInfo = TICKET_TYPES.find(t => t.value === ticket.type) || TICKET_TYPES[3];
                  const priority = getPriorityInfo(ticket.priority);
                  return (
                    <div key={ticket.id} className="relative bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-8 rounded-[32px] group hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all hover:shadow-2xl">
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border border-current ${typeInfo.color}`}>
                          {typeInfo.label}
                        </div>
                        <div className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${priority.style}`}>
                          {priority.label}
                        </div>
                      </div>

                      <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                           <TableIcon className="w-3 h-3" /> {ticket.department} • КАБ. {ticket.cabinet}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{ticket.subject}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed line-clamp-3">"{ticket.description || 'Описание отсутствует'}"</p>
                      </div>

                      <div className="flex items-center gap-4 py-4 border-t border-slate-50 dark:border-slate-800">
                         <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-400 uppercase text-xs">
                            {ticket.username ? ticket.username[0] : '?'}
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase truncate">{ticket.username}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Создано: {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 dark:border-slate-800 no-print">
                         <div className={`py-2 text-center text-[9px] font-black uppercase tracking-widest border ${
                           ticket.status === 'new' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' :
                           ticket.status === 'in-progress' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                           ticket.status === 'done' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-400 border-slate-100'
                         }`}>
                           {ticket.status === 'new' ? 'Ожидает' : ticket.status === 'in-progress' ? 'В работе' : 'Решено'}
                         </div>
                         
                         <div className="flex gap-1 justify-end">
                            {canExecute && ticket.status !== 'done' && (
                                <button onClick={() => handleUpdateStatus(ticket.id, 'in-progress')} className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white transition-all rounded-lg" title="Взять в работу"><ClockIcon className="w-4 h-4"/></button>
                            )}
                            {canExecute && (
                                <button onClick={() => handleUpdateStatus(ticket.id, 'done')} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all rounded-lg" title="Завершить"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg></button>
                            )}
                            {(canExecute || ticket.status === 'new') && (
                                <button onClick={() => handleDelete(ticket.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all rounded-lg" title="Удалить"><TrashIcon className="w-4 h-4"/></button>
                            )}
                         </div>
                      </div>
                      
                      {ticket.assignedToName && (
                        <div className="absolute top-4 right-8 text-[8px] font-black uppercase text-indigo-400 tracking-widest opacity-50">
                           Исполнитель: {ticket.assignedToName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 max-w-6xl mx-auto space-y-12 animate-slide-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 p-8 rounded-[40px] border-b-8 border-indigo-600 shadow-2xl flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Всего заявок</span>
                    <div className="text-7xl font-black text-white">{stats.total}</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Активные инциденты</span>
                    <div className="text-7xl font-black text-indigo-700 dark:text-indigo-400">{stats.open}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-500/20 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Решено (SLA)</span>
                    <div className="text-7xl font-black text-emerald-700 dark:text-emerald-400">{stats.closed}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Распределение нагрузки</h3>
                  <div className="space-y-4">
                     {stats.byType.map(type => (
                       <div key={type.value} className="space-y-2">
                          <div className="flex justify-between items-end">
                             <span className="text-[10px] font-black uppercase text-slate-500">{type.label}</span>
                             <span className="text-xs font-black text-slate-900 dark:text-white">{type.count} шт.</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${type.percent}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               
               <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6">Эффективность отдела</h3>
                  <div className="flex items-center justify-center py-10">
                     <div className="relative w-48 h-48 rounded-full border-[20px] border-emerald-500/10 flex items-center justify-center">
                        <div className="absolute inset-[-20px] rounded-full border-[20px] border-emerald-500" style={{ clipPath: `inset(0 ${100 - (stats.total > 0 ? (stats.closed / stats.total) * 100 : 0)}% 0 0)` }}></div>
                        <div className="text-center">
                           <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0}%</div>
                           <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Уровень успеха</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/95 backdrop-blur-xl">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[40px] animate-slide-in">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Сообщить об инциденте</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Техническая заявка</p>
                    </div>
                    <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all text-slate-400">
                        <svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14"/></svg>
                    </button>
                </div>
                <form onSubmit={handleAddTicket} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Тип проблемы</label>
                            <select value={newTicket.type} onChange={e => setNewTicket({...newTicket, type: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 rounded-2xl">
                                {TICKET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Приоритет</label>
                            <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 rounded-2xl">
                                <option value="low">НИЗКИЙ - Не горит</option>
                                <option value="medium">СРЕДНИЙ - Работа стоит</option>
                                <option value="high">ВЫСОКИЙ - Критическая ошибка</option>
                                <option value="critical">CRITICAL - Угроза безопасности / Пожар</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Краткая суть</label>
                        <input required value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sm uppercase text-slate-900 dark:text-white outline-none focus:border-indigo-600 rounded-2xl" placeholder="Напр. НЕ ПЕЧАТАЕТ ПРИНТЕР В 204 КАБИНЕТЕ" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Отдел-заявитель</label>
                            <select value={newTicket.department} onChange={e => setNewTicket({...newTicket, department: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white rounded-2xl">
                                {directory?.departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">№ Кабинета</label>
                            <select value={newTicket.cabinet} onChange={e => setNewTicket({...newTicket, cabinet: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white rounded-2xl">
                                {directory?.cabinets.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Подробности инцидента</label>
                        <textarea rows={4} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-900 dark:text-white outline-none focus:border-indigo-600 resize-none rounded-2xl font-medium" placeholder="Опишите, что произошло, коды ошибок, после чего началось..." />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-10 py-4 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-100">Отмена</button>
                        <button type="submit" className="bg-indigo-600 text-white px-16 py-4 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all rounded-2xl">Отправить в IT</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default HelpdeskView;
