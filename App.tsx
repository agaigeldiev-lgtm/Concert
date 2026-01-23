
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewMode, ConcertEvent, StaffRole } from './types';
import { storage } from './services/storage';
import { CalendarIcon, ListIcon, PlusIcon, SettingsIcon, UsersIcon, BellIcon, TableIcon } from './components/Icons';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import EventModal from './components/EventModal';
import SettingsModal from './components/SettingsModal';
import StatsView from './components/StatsView';

const formatNameWithInitials = (fullName: string) => {
  if (!fullName) return '—';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const surname = parts[0];
  const initials = parts.slice(1).map(p => `${p[0].toUpperCase()}.`).join(' ');
  return `${surname} ${initials}`;
};

const App: React.FC = () => {
  const [events, setEvents] = useState<ConcertEvent[]>([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ConcertEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [notifications, setNotifications] = useState<ConcertEvent[]>([]);

  const loadEvents = useCallback(() => {
    const allEvents = storage.getEvents();
    setEvents(allEvents);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setNotifications(allEvents.filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= tomorrow;
    }));
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayEvents = useMemo(() => events.filter(e => e.date === todayString), [events, todayString]);

  const handleOpenModal = (event?: ConcertEvent, day?: Date) => {
    setEditingEvent(event || null);
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const generateReport = (type: 'week' | 'month') => {
    alert(`Генерация PDF отчета за ${type === 'week' ? 'неделю' : 'месяц'}...`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Glass Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Концерты</h1>
              <p className="text-[10px] uppercase tracking-[0.1em] text-indigo-500 font-bold mt-1">Ставропольский Дворец детского творчества</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
              <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <CalendarIcon className="w-4 h-4" /> Календарь
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <ListIcon className="w-4 h-4" /> Список
              </button>
            </nav>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Настройки">
                <SettingsIcon className="w-6 h-6" />
              </button>
              <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 font-bold text-sm">
                <PlusIcon className="w-5 h-5" /> Создать
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10 space-y-12">
        
        {/* Alerts & Notifications */}
        {notifications.length > 0 && (
          <div className="relative overflow-hidden bg-white border border-rose-100 rounded-3xl p-6 shadow-sm flex items-center gap-6 group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
              <BellIcon className="w-32 h-32 text-rose-600" />
            </div>
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
              <BellIcon className="w-7 h-7 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-lg">Внимание: Ближайшие смены</h4>
              <p className="text-sm text-slate-500">У вас {notifications.length} мероприятий в ближайшие 24 часа. Проверьте готовность персонала.</p>
            </div>
            <div className="flex gap-2">
              {notifications.slice(0, 2).map(n => (
                <button key={n.id} onClick={() => handleOpenModal(n)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all">
                  {n.startTime} • {n.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Today's High-End Cards */}
        {todayEvents.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Сегодня в работе</h2>
              </div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {todayEvents.map(event => (
                <div key={event.id} onClick={() => handleOpenModal(event)} className="bg-gradient-to-tr from-white via-white to-slate-50/80 group cursor-pointer rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.15)] hover:-translate-y-1.5 transition-all duration-500 overflow-hidden relative">
                  <div className="p-8 flex flex-col sm:flex-row gap-8 relative z-10">
                    <div className="flex flex-col justify-between sm:w-40 shrink-0">
                      <div>
                        <div className={`inline-flex px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider mb-4 shadow-sm transition-all duration-500 group-hover:scale-105 ${event.isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {event.isPaid ? 'Коммерция' : 'Бюджет'}
                        </div>
                        <div className="text-5xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors duration-500">{event.startTime}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Старт шоу</div>
                      </div>
                      <div className="mt-8 flex items-center gap-2.5 text-slate-400 group-hover:text-indigo-600 transition-all duration-500 group-hover:translate-x-1">
                        <span className="text-[10px] font-black uppercase tracking-widest">Детали</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors duration-500">{event.title}</h3>
                        <p className="text-slate-500 font-semibold flex items-center gap-2 mt-3 text-sm">
                          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          </div>
                          {event.venue}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors duration-500">
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em]">Администратор</span>
                          <div className="text-sm font-bold text-slate-700 truncate">{formatNameWithInitials(event.staff[StaffRole.ADMIN])}</div>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em]">Звукорежиссер</span>
                          <div className="text-sm font-bold text-slate-700 truncate">{formatNameWithInitials(event.staff[StaffRole.SOUND])}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative background element */}
                  <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${event.isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-2 shadow-sm">
          {viewMode === 'calendar' ? (
            <CalendarView
              events={events}
              currentDate={currentDate}
              onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              onEventClick={handleOpenModal}
              onDayClick={(day) => { setCurrentDate(day); handleOpenModal(undefined, day); }}
            />
          ) : (
            <div className="p-4">
              <ListView events={events} onEdit={handleOpenModal} onDelete={(id) => { storage.deleteEvent(id); loadEvents(); }} />
            </div>
          )}
        </section>

        <StatsView events={events} currentDate={currentDate} />

      </main>

      <footer className="py-10 border-t border-slate-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 grayscale opacity-50">
             <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
             <span className="font-bold text-slate-900 tracking-tighter">Концерты</span>
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <button onClick={() => generateReport('week')} className="hover:text-indigo-600 transition-colors">Отчет за неделю</button>
            <button onClick={() => generateReport('month')} className="hover:text-indigo-600 transition-colors">Отчет за месяц</button>
            <span>© 2025 Enterprise Edition</span>
          </div>
        </div>
      </footer>

      <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadEvents} eventToEdit={editingEvent} initialDate={selectedDay} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={loadEvents} />
    </div>
  );
};

export default App;
