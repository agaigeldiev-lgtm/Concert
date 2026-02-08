
import React, { useState, useMemo } from 'react';
import { Vehicle, ConcertEvent } from '../types';
import { CarIcon, UsersIcon, ShieldIcon, MusicIcon, CalendarIcon } from './Icons';

interface WatchmanViewProps {
  events: ConcertEvent[];
  vehicles: Vehicle[];
}

const WatchmanView: React.FC<WatchmanViewProps> = ({ events, vehicles }) => {
  const [search, setSearch] = useState('');
  const [dateOffset, setDateOffset] = useState(0); // 0 - сегодня, 1 - завтра, 2 - послезавтра
  
  const now = new Date();
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const viewEvents = useMemo(() => 
    events.filter(e => e.date === selectedDateStr && !e.isCancelled)
  , [events, selectedDateStr]);
  
  const viewStaff = useMemo(() => {
    const names = new Set<string>();
    viewEvents.forEach(ev => {
        (Object.values(ev.staff || {}) as string[]).forEach(name => {
            if (name) names.add(name);
        });
    });
    return Array.from(names).sort();
  }, [viewEvents]);

  const expectedVehicles = useMemo(() => {
    return vehicles.filter(v => v.isExpectedToday).sort((a,b) => a.ownerName.localeCompare(b.ownerName));
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!search) return expectedVehicles;
    const q = search.toLowerCase();
    return vehicles.filter(v => 
        v.plateNumber.toLowerCase().includes(q) || 
        v.ownerName.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    );
  }, [vehicles, expectedVehicles, search]);

  const dateTabs = [
    { label: 'Сегодня', offset: 0 },
    { label: 'Завтра', offset: 1 },
    { label: 'Послезавтра', offset: 2 },
  ];

  return (
    <div className="p-8 space-y-12 animate-slide-in">
        {/* Header Block */}
        <div className="bg-slate-900 text-white rounded-[40px] p-10 flex flex-col xl:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-4 text-center xl:text-left w-full xl:w-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4">
                    <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-900/50">
                        <ShieldIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Пост №1: ВАХТА</h2>
                        <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
                           {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Date Selector Tabs */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 self-center xl:self-start">
                    {dateTabs.map(tab => (
                        <button
                            key={tab.offset}
                            onClick={() => setDateOffset(tab.offset)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                dateOffset === tab.offset 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="relative z-10 w-full md:w-96">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="ПОИСК ГОСНОМЕРА ИЛИ ФИО..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 pl-14 pr-6 py-5 rounded-[24px] text-white font-black text-sm uppercase tracking-widest outline-none focus:bg-white focus:text-slate-900 focus:border-white transition-all shadow-inner"
                    />
                    <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
            </div>
            <ShieldIcon className="absolute right-[-40px] top-[-40px] w-80 h-80 opacity-5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Транспортный блок */}
            <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <CarIcon className="w-6 h-6 text-indigo-600" /> Оперативный допуск ТС
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">В базе поиска: {vehicles.length}</span>
                    </div>
                </div>

                {filteredVehicles.length === 0 ? (
                    <div className="py-24 text-center border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-[40px]">
                        <CarIcon className="w-16 h-16 text-slate-100 dark:text-slate-800 mx-auto mb-6" />
                        <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-xs">Для текущих критериев ТС не найдены</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredVehicles.map(v => (
                            <div key={v.id} className={`p-8 bg-white dark:bg-slate-900 border-2 rounded-[32px] transition-all hover:shadow-2xl hover:scale-[1.01] ${v.isExpectedToday ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="inline-flex items-center bg-slate-900 text-white border-2 border-slate-900 px-4 py-2 gap-3 rounded-lg shadow-lg">
                                        <span className="text-2xl font-mono font-black uppercase">{(v.plateNumber || '').slice(0, -2).toUpperCase()}</span>
                                        <div className="w-px h-6 bg-white/20"></div>
                                        <div className="flex flex-col items-center leading-none">
                                            <span className="text-[8px] font-black opacity-60">RUS</span>
                                            <span className="text-sm font-mono font-black">{(v.plateNumber || '').slice(-2)}</span>
                                        </div>
                                    </div>
                                    {v.isExpectedToday && (
                                        <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full shadow-md">Ожидается</span>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{v.ownerName}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{v.department} • {v.model}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                        <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:underline">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                            {v.phone}
                                        </a>
                                        {v.isCallEntry && <span className="text-[9px] font-black text-amber-500 uppercase bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">Въезд по звонку</span>}
                                    </div>
                                    {v.notes && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">" {v.notes} "</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Блок персонала и событий */}
            <div className="lg:col-span-4 space-y-10">
                {/* События */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <MusicIcon className="w-5 h-5 text-indigo-600" /> Мероприятия: {dateTabs.find(t => t.offset === dateOffset)?.label.toLowerCase()}
                    </h3>
                    <div className="space-y-3">
                        {viewEvents.length > 0 ? viewEvents.map(ev => (
                            <div key={ev.id} className="p-6 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{ev.startTime}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{ev.venue}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{ev.title}</h4>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                                    <span>Заезд: {ev.arrivalTime}</span>
                                    <span>Чек: {ev.soundcheckTime}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <MusicIcon className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">В графике пусто</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Люди */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <UsersIcon className="w-5 h-5 text-emerald-600" /> Команда в графике
                    </h3>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
                        {viewStaff.length > 0 ? (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {viewStaff.map(name => (
                                    <div key={name} className="px-6 py-5 flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                            {name[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <UsersIcon className="w-8 h-8 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Персонал не назначен</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default WatchmanView;
