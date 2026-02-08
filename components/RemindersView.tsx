
import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, User } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, TrashIcon, BellIcon, ClockIcon } from './Icons';

interface RemindersViewProps {
  currentUser: User;
}

const CATEGORIES = {
  timesheet: { label: 'Табель учета', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  criteria: { label: 'Критерии', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  report: { label: 'Отчетность', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  other: { label: 'Прочее', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' }
};

const RemindersView: React.FC<RemindersViewProps> = ({ currentUser }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    deadline: new Date().toISOString().split('T')[0],
    category: 'timesheet',
    notes: ''
  });

  const canManage = currentUser.roles.includes('admin');

  useEffect(() => {
    storage.getReminders().then(data => {
      setReminders(data);
      setLoading(false);
    });
  }, []);

  const sortedReminders = useMemo(() => {
    let result = [...reminders];
    if (filter === 'active') result = result.filter(r => !r.isCompleted);
    if (filter === 'completed') result = result.filter(r => r.isCompleted);

    return result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [reminders, filter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: newReminder.title || '',
      deadline: newReminder.deadline || '',
      category: newReminder.category as any,
      isCompleted: false,
      notes: newReminder.notes || '',
      createdAt: new Date().toISOString()
    };

    const updated = [reminder, ...reminders];
    setReminders(updated);
    await storage.saveReminders(updated);
    setIsModalOpen(false);
    setNewReminder({ title: '', deadline: new Date().toISOString().split('T')[0], category: 'timesheet', notes: '' });
  };

  const handleToggle = async (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r);
    setReminders(updated);
    await storage.saveReminders(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить напоминание?')) return;
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    await storage.saveReminders(updated);
  };

  const getStatusInfo = (deadline: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dDate = new Date(deadline);
    dDate.setHours(0,0,0,0);
    
    const diffTime = dDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Просрочено', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' };
    if (diffDays === 0) return { text: 'СЕГОДНЯ', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' };
    if (diffDays === 1) return { text: 'ЗАВТРА', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' };
    return { text: `Через ${diffDays} дн.`, color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' };
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-full transition-colors duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
            <BellIcon className="w-8 h-8 text-rose-600 dark:text-rose-400" /> ДЕДЛАЙНЫ
          </h2>
          <div className="flex items-center gap-4 mt-2">
            {['active', 'completed', 'all'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${filter === f ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
              >
                {f === 'active' ? 'Актуальные' : f === 'completed' ? 'Выполненные' : 'Все'}
              </button>
            ))}
          </div>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="bg-rose-600 text-white px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 dark:shadow-none">
            <PlusIcon className="w-5 h-5" /> Новый дедлайн
          </button>
        )}
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-20 font-black text-slate-200 dark:text-slate-800 animate-pulse uppercase tracking-widest">Загрузка...</div>
        ) : sortedReminders.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-slate-100 dark:border-slate-800">
            <BellIcon className="w-16 h-16 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.2em] text-xs">Напоминаний нет</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReminders.map(reminder => {
              const status = getStatusInfo(reminder.deadline);
              const category = (CATEGORIES as any)[reminder.category];
              return (
                <div key={reminder.id} className={`flex items-center gap-6 p-6 border transition-all ${reminder.isCompleted ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:shadow-lg dark:hover:bg-slate-800/60'}`}>
                  <button 
                    onClick={() => handleToggle(reminder.id)}
                    className={`w-8 h-8 flex items-center justify-center border-2 transition-all shrink-0 ${reminder.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 hover:border-rose-500 text-transparent'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase border ${category.color} ${category.bg} border-current shrink-0`}>
                        {category.label}
                      </span>
                      <h3 className={`text-sm font-black uppercase tracking-tight truncate ${reminder.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {reminder.title}
                      </h3>
                    </div>
                    {reminder.notes && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic truncate">{reminder.notes}</p>}
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 ${status.bg} ${status.color}`}>
                      {reminder.isCompleted ? 'СДАНО' : status.text}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 tabular-nums">
                      ДО {new Date(reminder.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {canManage && (
                    <button onClick={() => handleDelete(reminder.id)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl border-t-4 border-rose-600 dark:border-rose-500 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Новое напоминание</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2"><PlusIcon className="w-7 h-7 rotate-45"/></button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Документ / Задача</label>
                <input required value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white" placeholder="Напр. Сдача табеля за октябрь" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Дедлайн</label>
                  <input required type="date" value={newReminder.deadline} onChange={e => setNewReminder({...newReminder, deadline: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Категория</label>
                  <select value={newReminder.category} onChange={e => setNewReminder({...newReminder, category: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase outline-none focus:border-rose-600 dark:text-slate-300">
                    {Object.entries(CATEGORIES).map(([val, {label}]) => <option key={val} value={val} className="bg-white dark:bg-slate-900">{label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Примечание</label>
                <textarea rows={3} value={newReminder.notes} onChange={e => setNewReminder({...newReminder, notes: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm italic outline-none focus:border-rose-600 resize-none text-slate-900 dark:text-white" placeholder="Дополнительная информация..." />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">Отмена</button>
                <button type="submit" className="px-12 py-3 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none hover:bg-rose-700 transition-all">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersView;
