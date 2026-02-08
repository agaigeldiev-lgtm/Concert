
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConcertEvent, User, ViewMode, MainSection, Reminder, InfoArticle, StaffDirectory, QuickLink, BirthdayRecord, UserRole, HelpdeskTicket, Vehicle } from './types';
import { storage } from './services/storage';
import { 
  CalendarIcon, ListIcon, PlusIcon, SettingsIcon, 
  BellIcon, TableIcon, PrinterIcon, CarIcon, 
  LifeBuoyIcon, MonitorIcon, MusicIcon, BookIcon, PulseIcon,
  ShieldIcon, ChevronLeft, ChevronRight, ClockIcon
} from './components/Icons';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import EventModal from './components/EventModal';
import SettingsModal from './components/SettingsModal';
import StatsView from './components/StatsView';
import ReportView from './components/ReportView';
import ParkingView from './components/ParkingView';
import HelpdeskView from './components/HelpdeskView';
import InventoryView from './components/InventoryView';
import InfoView from './components/InfoView';
import RemindersView from './components/RemindersView';
import GuestGuidesView from './components/GuestGuidesView';
import ArtistPortal from './components/ArtistPortal';
import EventArtistPortal from './components/EventArtistPortal';
import AuthScreen from './components/AuthScreen';
import WatchmanView from './components/WatchmanView';

const App: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const publicGuideId = urlParams.get('guide');
  const publicEventId = urlParams.get('event_id');

  const [currentUser, setCurrentUser] = useState<User | null>(storage.getAuth());
  const [events, setEvents] = useState<ConcertEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [publicArticles, setPublicArticles] = useState<InfoArticle[]>([]);
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainSection, setMainSection] = useState<MainSection | 'dashboard'>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [itMode, setItMode] = useState<'helpdesk' | 'inventory'>('helpdesk');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ConcertEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const isAdmin = useMemo(() => currentUser?.roles?.includes('admin') || false, [currentUser]);

  const hasAccess = useCallback((sectionId: string): boolean => {
    if (!currentUser || !Array.isArray(currentUser.roles)) return false;
    if (currentUser.roles.includes('admin')) return true;
    if (sectionId === 'dashboard') return true;
    if (sectionId === 'it') {
      return currentUser.roles.some(r => typeof r === 'string' && r.startsWith('it_'));
    }
    if (sectionId === 'watchman') {
      return currentUser.roles.includes('security') || currentUser.roles.includes('parking');
    }

    const sectionToRoleMap: Record<string, UserRole> = {
      'concerts': 'concerts',
      'admin': 'parking',
      'info': 'info'
    };

    const requiredRole = sectionToRoleMap[sectionId];
    if (requiredRole) {
      return currentUser.roles.includes(requiredRole);
    }
    return false;
  }, [currentUser]);

  const canSeeItHelpdesk = useMemo(() => 
    isAdmin || (Array.isArray(currentUser?.roles) && (currentUser.roles.includes('it_tickets') || currentUser.roles.includes('it_admin'))), 
  [isAdmin, currentUser]);

  const canSeeItInventory = useMemo(() => 
    isAdmin || (Array.isArray(currentUser?.roles) && (currentUser.roles.includes('it_inventory') || currentUser.roles.includes('it_admin'))), 
  [isAdmin, currentUser]);

  useEffect(() => {
    if (mainSection === 'it') {
      if (!canSeeItHelpdesk && canSeeItInventory) setItMode('inventory');
      if (canSeeItHelpdesk && !canSeeItInventory) setItMode('helpdesk');
    }
  }, [mainSection, canSeeItHelpdesk, canSeeItInventory]);

  const navItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Обзор', icon: <PulseIcon className="w-5 h-5" />, color: 'indigo' },
      { id: 'watchman', label: 'Вахта', icon: <ShieldIcon className="w-5 h-5" />, color: 'rose' },
      { id: 'concerts', label: 'События', icon: <MusicIcon className="w-5 h-5" />, color: 'violet' },
      { id: 'admin', label: 'Парковка', icon: <CarIcon className="w-5 h-5" />, color: 'emerald' },
      { id: 'it', label: 'IT-отдел', icon: <LifeBuoyIcon className="w-5 h-5" />, color: 'blue' },
      { id: 'info', label: 'Инфоцентр', icon: <BookIcon className="w-5 h-5" />, color: 'amber' },
    ];
    return items.filter(item => hasAccess(item.id));
  }, [currentUser, hasAccess]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await storage.checkConnection();
      if (status.online) {
        if (!currentUser && !publicEventId && !publicGuideId) {
          const articles = await storage.getInfoArticles();
          setPublicArticles(articles.filter(a => a.isPublic));
          setEvents([]);
        } else {
          const [allEvents, cancelledRegistry, rentalsRegistry, allReminders, dir, allTickets, allVehicles] = await Promise.all([
            storage.getEvents(),
            storage.getCancelledEventsRegistry(),
            storage.getRentalsRegistry(),
            storage.getReminders(),
            storage.getStaffDirectory(),
            storage.getHelpdeskTickets(),
            storage.getParkingList()
          ]);
          
          const processedEvents = (allEvents || []).map(event => ({
            ...event,
            isCancelled: !!(cancelledRegistry && cancelledRegistry[event.id]),
            rentedEquipment: (rentalsRegistry && rentalsRegistry[event.id]) || []
          }));

          setEvents(processedEvents);
          setReminders(allReminders || []);
          setDirectory(dir);
          setTickets(allTickets || []);
          setVehicles(allVehicles || []);
        }
      }
    } catch (err: any) {
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  }, [currentUser, publicEventId, publicGuideId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    storage.saveAuth(null);
    setCurrentUser(null);
  };

  if (publicGuideId) return <ArtistPortal guideId={publicGuideId} />;
  if (publicEventId) return <EventArtistPortal eventId={publicEventId} />;
  if (!currentUser) return <AuthScreen onLogin={setCurrentUser} publicArticles={publicArticles} isLoading={loading} />;

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 z-50 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <PulseIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">ПУЛЬС ДВОРЦА</h1>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">Control Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMainSection(item.id as any);
                if (item.id === 'concerts') setViewMode('calendar');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                mainSection === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm shadow-indigo-100/50 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className={`transition-colors ${mainSection === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-bold">{item.label}</span>
              {mainSection === item.id && <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
             <div className="w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400">
                {currentUser.username[0]}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser.username}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {isAdmin ? 'Администратор' : 'Сотрудник'}
                </p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={toggleTheme}
              className="flex-1 flex justify-center p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors border border-slate-100 dark:border-slate-800"
              title={isDark ? "Светлая тема" : "Темная тема"}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            {isAdmin && (
              <button onClick={() => setIsSettingsOpen(true)} className="flex-1 flex justify-center p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors border border-slate-100 dark:border-slate-800">
                <SettingsIcon className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleLogout} className="flex-1 flex justify-center p-2 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors border border-slate-100 dark:border-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-8 flex items-center justify-between z-40 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-6">
             <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {mainSection === 'dashboard' && 'Центр управления'}
                {mainSection === 'watchman' && 'Пост охраны: Вахта'}
                {mainSection === 'concerts' && 'Планирование мероприятий'}
                {mainSection === 'admin' && 'Администрирование'}
                {mainSection === 'it' && 'ИТ-сервис'}
                {mainSection === 'info' && 'База знаний'}
             </h2>
             {mainSection === 'concerts' && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Календарь</button>
                  <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Список</button>
                  <button onClick={() => setViewMode('report')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'report' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>План</button>
                  <button onClick={() => setViewMode('stats')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'stats' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Аналитика</button>
                  {isAdmin && (
                    <button onClick={() => setViewMode('guides-manager')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'guides-manager' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Гиды</button>
                  )}
                </div>
             )}
             {mainSection === 'it' && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {canSeeItHelpdesk && (
                    <button onClick={() => setItMode('helpdesk')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${itMode === 'helpdesk' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Поддержка</button>
                  )}
                  {canSeeItInventory && (
                    <button onClick={() => setItMode('inventory')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${itMode === 'inventory' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Инвентарь</button>
                  )}
                </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
           <div className="max-w-7xl mx-auto animate-slide-in">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-40">
                   <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full mb-4"></div>
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Загрузка данных...</p>
                </div>
              ) : (
                <>
                  {mainSection === 'dashboard' && <DashboardView events={events} reminders={reminders} quickLinks={directory?.quickLinks || []} birthdays={directory?.birthdays || []} tickets={tickets} vehicles={vehicles} />}
                  {mainSection === 'watchman' && <WatchmanView events={events} vehicles={vehicles} />}
                  {mainSection === 'concerts' && (
                    <div className={viewMode === 'stats' || viewMode === 'guides-manager' ? '' : 'bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300'}>
                       {viewMode === 'calendar' && <CalendarView events={events} currentDate={currentDate} onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} onEventClick={(ev) => {setEditingEvent(ev); setIsModalOpen(true);}} onDayClick={(day) => {if(isAdmin) {setSelectedDay(day); setEditingEvent(null); setIsModalOpen(true);}}} />}
                       {viewMode === 'list' && <ListView events={events} onEdit={(ev) => {setEditingEvent(ev); setIsModalOpen(true);}} onDelete={async (id) => {if(confirm('Удалить?')){await storage.deleteEvent(id); loadData();}}} canManage={isAdmin} />}
                       {viewMode === 'report' && <ReportView events={events} currentDate={currentDate} />}
                       {viewMode === 'stats' && <StatsView events={events} currentDate={currentDate} />}
                       {viewMode === 'guides-manager' && <GuestGuidesView />}
                    </div>
                  )}
                  {mainSection === 'admin' && <ParkingView />}
                  {mainSection === 'it' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                      {itMode === 'helpdesk' ? <HelpdeskView currentUser={currentUser} /> : <InventoryView currentUser={currentUser} />}
                    </div>
                  )}
                  {mainSection === 'info' && <InfoView currentUser={currentUser} />}
                </>
              )}
           </div>
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 z-50">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setMainSection(item.id as any)}
            className={`flex flex-col items-center gap-1 ${mainSection === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadData} eventToEdit={editingEvent} initialDate={selectedDay} canEdit={isAdmin} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={loadData} />
    </div>
  );
};

// Updated DashboardView component
interface DashboardViewProps {
  events: ConcertEvent[];
  reminders: Reminder[];
  quickLinks: QuickLink[];
  birthdays: BirthdayRecord[];
  tickets: HelpdeskTicket[];
  vehicles: Vehicle[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ events, reminders, quickLinks, birthdays, tickets, vehicles }) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const todayEvents = events.filter(e => e.date === today && !e.isCancelled);
  const tomorrowEvents = events.filter(e => e.date === tomorrow && !e.isCancelled);
  
  // Calculate next event countdown
  const nextEvent = useMemo(() => {
    const upcoming = [...todayEvents].sort((a,b) => a.startTime.localeCompare(b.startTime));
    return upcoming.find(e => {
        const [h, m] = e.startTime.split(':').map(Number);
        const evTime = new Date();
        evTime.setHours(h, m, 0, 0);
        return evTime > now;
    });
  }, [todayEvents, now]);

  const stats = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year && !e.isCancelled;
    });
    
    const completed = monthEvents.filter(e => {
        const d = new Date(e.date);
        d.setHours(23,59,59);
        return d < now;
    }).length;

    return {
        activeTickets: tickets.filter(t => t.status !== 'done' && t.status !== 'rejected').length,
        expectedVehicles: vehicles.filter(v => v.isExpectedToday).length,
        monthlyTotal: monthEvents.length,
        monthlyCompleted: completed,
        monthlyProgress: monthEvents.length > 0 ? Math.round((completed / monthEvents.length) * 100) : 0
    };
  }, [events, tickets, vehicles, now]);

  const EventCard: React.FC<{ event: ConcertEvent }> = ({ event }) => {
    // Fix: Added type assertion to cast Object.entries result to [string, string][] to ensure 'name' is string
    const staffEntries = (Object.entries(event.staff || {}).filter(([_, name]) => !!name)) as [string, string][];
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${event.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
              {event.isPaid ? 'Коммерция' : 'Бюджет'}
           </span>
           <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{event.startTime}</span>
        </div>
        <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{event.title}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{event.venue}</p>
        
        {staffEntries.length > 0 && (
          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Команда смены:</p>
             <div className="grid grid-cols-1 gap-2">
                {staffEntries.map(([role, name]) => (
                  <div key={role} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[100px]">{role}</span>
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate ml-2">{name.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-10">
      {/* Header Banner */}
      <div className="bg-indigo-600 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-black uppercase tracking-tight">Центральный узел</h2>
            <p className="text-indigo-100 font-bold uppercase text-[10px] tracking-[0.2em]">Статус системы: Штатно • {now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          
          {nextEvent ? (
            <div className="bg-white/10 backdrop-blur-md p-6 border border-white/10 rounded-2xl flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Ближайший старт: {nextEvent.startTime}</span>
                <div className="text-2xl font-black tracking-tighter truncate max-w-[200px]">{nextEvent.title}</div>
            </div>
          ) : (
            <div className="text-center bg-indigo-500/30 px-6 py-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest">Программа на сегодня завершена</span>
            </div>
          )}
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-10">
          <PulseIcon className="w-64 h-64" />
        </div>
      </div>

      {/* Monthly Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Прогресс месяца</p>
            <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.monthlyCompleted}/{stats.monthlyTotal}</div>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${stats.monthlyProgress}%` }}></div>
                </div>
                <span className="text-xs font-black text-indigo-600">{stats.monthlyProgress}%</span>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Активные тикеты IT</p>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeTickets}</div>
            </div>
            <LifeBuoyIcon className={`w-8 h-8 ${stats.activeTickets > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-100 dark:text-slate-800'}`} />
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Парковка сегодня</p>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.expectedVehicles}</div>
            </div>
            <CarIcon className="w-8 h-8 text-indigo-600/30" />
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Дедлайны скоро</p>
                <div className="text-2xl font-black text-rose-600">{reminders.filter(r => !r.isCompleted).length}</div>
            </div>
            <BellIcon className="w-8 h-8 text-rose-600/30" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* СЕГОДНЯ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Сегодня в графике</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todayEvents.length > 0 ? todayEvents.map(event => (
                <EventCard key={event.id} event={event} />
              )) : (
                <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Мероприятий на сегодня нет</p>
                </div>
              )}
            </div>
          </section>

          {/* ЗАВТРА */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight opacity-60">Завтра, {new Date(tomorrow).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tomorrowEvents.length > 0 ? tomorrowEvents.map(event => (
                <EventCard key={event.id} event={event} />
              )) : (
                <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed opacity-60">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Мероприятий на завтра нет</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Быстрые ссылки</h3>
            <div className="grid grid-cols-1 gap-2">
              {(quickLinks || []).map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{link.title}</span>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              ))}
            </div>
          </div>

          {(birthdays || []).length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Дни рождения</h3>
              <div className="space-y-4">
                {birthdays.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                      {b.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{b.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(b.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
