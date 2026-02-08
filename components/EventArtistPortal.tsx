
import React, { useState, useEffect } from 'react';
import { ConcertEvent, StaffDirectory, Employee } from '../types';
import { storage } from '../services/storage';
import { PulseIcon } from './Icons';

interface EventArtistPortalProps {
  eventId: string;
}

const EventArtistPortal: React.FC<EventArtistPortalProps> = ({ eventId }) => {
  const [event, setEvent] = useState<ConcertEvent | null>(null);
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allEvents, dir] = await Promise.all([
          storage.getEvents(),
          storage.getStaffDirectory()
        ]);
        const found = allEvents.find(e => e.id === eventId);
        setEvent(found || null);
        setDirectory(dir);
      } catch (err) {
        console.error('Portal load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
       <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-4"></div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em]">Загрузка данных смены...</p>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
       <h1 className="text-2xl font-black uppercase mb-2">Мероприятие не найдено</h1>
       <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Проверьте корректность ссылки</p>
    </div>
  );

  // Находим телефоны сотрудников
  const getEmployeePhone = (name: string) => {
    const emp = directory?.employees.find(e => e.name === name);
    return emp?.phone || null;
  };

  // Более безопасное извлечение списка персонала
  const staffList = (Object.entries(event.staff || {}) as [string, string][])
    .filter(([_, name]) => !!name)
    .map(([role, name]) => ({
      role,
      name,
      phone: getEmployeePhone(name)
    }));

  // Оставляем только "Технический специалист" в единственном числе
  const techStaff = staffList.filter(s => s.role === 'Технический специалист');
  
  const adminStaff = staffList.find(s => s.role === 'Администратор');
  const securityStaff = staffList.find(s => s.role === 'Отв. за без-сть');

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1514525253361-bee8718a300a?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
        
        <div className="relative z-10 text-center space-y-4 max-w-2xl">
          <div className="w-12 h-12 bg-indigo-600 flex items-center justify-center mx-auto rounded-xl transform rotate-3 mb-6">
             <PulseIcon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">{event.title}</h1>
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 bg-indigo-900/30 px-4 py-1.5 border border-indigo-500/20 inline-block">
            {new Date(event.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">{event.venue}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-10 relative z-20 space-y-8">
        
        {/* Timing Section */}
        <div className="bg-slate-900 border border-white/10 p-8 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6 border-b border-white/5 pb-4">График дня</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Заезд', time: event.arrivalTime },
                    { label: 'Чек', time: event.soundcheckTime },
                    { label: 'Двери', time: event.doorsTime },
                    { label: 'Старт', time: event.startTime, highlight: true },
                ].map((item) => (
                    <div key={item.label} className="text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className={`text-xl font-black ${item.highlight ? 'text-indigo-400' : 'text-white'}`}>{item.time}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Contacts Section */}
        <section className="space-y-4">
           <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-4">
              Команда смены
              <div className="h-px bg-slate-800 flex-1"></div>
           </h2>

           <div className="grid grid-cols-1 gap-3">
              {/* Администратор */}
              {adminStaff && (
                <ContactCard 
                    role="Администратор площадки" 
                    name={adminStaff.name} 
                    phone={adminStaff.phone} 
                    color="bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                />
              )}

              {/* Безопасник */}
              {securityStaff && (
                <ContactCard 
                    role="Служба безопасности" 
                    name={securityStaff.name} 
                    phone={securityStaff.phone} 
                    color="bg-rose-600/20 text-rose-400 border-rose-500/30"
                />
              )}

              {/* Техническая группа */}
              {techStaff.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                   <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-4">Техническая поддержка</h3>
                   <div className="space-y-3">
                      {techStaff.map((staff) => (
                        <ContactCard 
                            key={staff.role} 
                            role={staff.role} 
                            name={staff.name} 
                            phone={staff.phone} 
                            color="bg-slate-800 text-slate-300 border-white/5"
                        />
                      ))}
                   </div>
                </div>
              )}
           </div>
        </section>

        {/* Technical Info */}
        {(event.rider || event.notes) && (
            <section className="space-y-4 pt-6">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-4">
                    Примечания
                    <div className="h-px bg-slate-800 flex-1"></div>
                </h2>
                
                {event.rider && (
                    <div className="bg-slate-900 border border-white/5 p-6">
                        <h4 className="text-[9px] font-black uppercase text-amber-500 tracking-widest mb-3">Технический райдер</h4>
                        <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">{event.rider}</p>
                    </div>
                )}

                {event.notes && (
                    <div className="bg-slate-900 border border-white/5 p-6">
                        <h4 className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-3">Организационные заметки</h4>
                        <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">{event.notes}</p>
                    </div>
                )}
            </section>
        )}

        <div className="pt-20 text-center">
           <div className="flex items-center justify-center gap-2 text-indigo-600/30 mb-2">
              <PulseIcon className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Пульс Дворца • Artist Hub</span>
           </div>
           <p className="text-[8px] font-bold text-slate-700 uppercase">Сгенерировано автоматически для данного события</p>
        </div>
      </div>
    </div>
  );
};

const ContactCard: React.FC<{ role: string, name: string, phone: string | null, color: string }> = ({ role, name, phone, color }) => (
    <div className={`p-5 border flex items-center justify-between gap-4 ${color}`}>
        <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{role}</p>
            <h4 className="text-sm font-black uppercase leading-tight break-words">{name}</h4>
        </div>
        {phone ? (
            <a href={`tel:${phone}`} className="w-10 h-10 bg-white/10 flex items-center justify-center rounded-full hover:bg-white hover:text-slate-950 transition-all shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </a>
        ) : (
            <span className="text-[8px] font-black uppercase opacity-40 shrink-0">Нет тел.</span>
        )}
    </div>
);

export default EventArtistPortal;
