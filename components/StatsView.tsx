
import React, { useMemo, useState, useEffect } from 'react';
import { ConcertEvent, StaffDirectory } from '../types';
import { storage } from '../services/storage';
import { UsersIcon, TableIcon } from './Icons';

interface StatsViewProps {
  events: ConcertEvent[];
  currentDate: Date;
}

interface StaffWorkload {
  name: string;
  paid: number;
  free: number;
  total: number;
}

const StatsView: React.FC<StatsViewProps> = ({ events, currentDate }) => {
  const [activeStaffTab, setActiveStaffTab] = useState<'paid' | 'free'>('paid');
  const [settings, setSettings] = useState<StaffDirectory | null>(null);

  useEffect(() => {
    storage.getStaffDirectory().then(setSettings);
  }, []);

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Фильтруем события: только текущий месяц и только НЕ ОТМЕНЕННЫЕ
  const monthlyEvents = useMemo(() => events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month && !e.isCancelled;
  }), [events, year, month]);

  const financialStats = useMemo(() => {
    const paid = monthlyEvents.filter(e => e.isPaid).length;
    const free = monthlyEvents.filter(e => !e.isPaid).length;
    const total = monthlyEvents.length || 1;
    return { paid, free, paidPercent: Math.round((paid / total) * 100), freePercent: Math.round((free / total) * 100) };
  }, [monthlyEvents]);

  const staffWorkload = useMemo(() => {
    const workloadMap: Record<string, { paid: number, free: number, total: number }> = {};
    
    monthlyEvents.forEach(event => {
      if (!event.staff) return;
      Object.entries(event.staff).forEach(([role, name]) => {
        if (role === 'Дежурный') return;

        if (name && typeof name === 'string' && name.trim()) {
          const staffName = name.trim();
          if (!workloadMap[staffName]) {
            workloadMap[staffName] = { paid: 0, free: 0, total: 0 };
          }
          if (event.isPaid) workloadMap[staffName].paid++;
          else workloadMap[staffName].free++;
          workloadMap[staffName].total++;
        }
      });
    });

    return Object.entries(workloadMap)
      .map(([name, stats]): StaffWorkload => ({
        name,
        ...stats
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyEvents]);

  const getRoleBreakdown = (eventList: ConcertEvent[]) => {
    if (!settings) return [];
    
    const breakdown: Record<string, Record<string, number>> = {};
    
    settings.roles.forEach(role => {
      if (role === 'Дежурный') return;
      breakdown[role] = {};
    });

    eventList.forEach(event => {
      if (!event.staff) return;
      Object.entries(event.staff).forEach(([role, name]) => {
        if (role === 'Дежурный') return;
        
        if (name && typeof name === 'string' && name.trim()) {
          const staffName = name.trim();
          if (!breakdown[role]) {
            breakdown[role] = {};
          }
          breakdown[role][staffName] = (breakdown[role][staffName] || 0) + 1;
        }
      });
    });

    return Object.entries(breakdown).map(([role, counts]) => ({
      role,
      workers: Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      total: Object.values(counts).reduce((a, b) => a + b, 0)
    })).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
  };

  const roleBreakdownPaid = useMemo(() => getRoleBreakdown(monthlyEvents.filter(e => e.isPaid)), [monthlyEvents, settings]);
  const roleBreakdownFree = useMemo(() => getRoleBreakdown(monthlyEvents.filter(e => !e.isPaid)), [monthlyEvents, settings]);

  if (monthlyEvents.length === 0) return (
    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
       <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-none flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
         <TableIcon className="w-8 h-8" />
       </div>
       <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Нет активных данных для аналитики в {monthName}</p>
    </div>
  );

  const currentBreakdown = activeStaffTab === 'paid' ? roleBreakdownPaid : roleBreakdownFree;

  return (
    <section className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Аналитика периода</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Данные за {monthName} (без учета дежурств и отмен)</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Проведено</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{monthlyEvents.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Платные</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{financialStats.paid}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Бесплатные</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{financialStats.free}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Актив. персонал</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{staffWorkload.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-colors">
           <div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">Типы мероприятий</h3>
             <p className="text-sm text-slate-400 dark:text-slate-500">Соотношение по оплате</p>
           </div>
           
           <div className="py-10 flex flex-col items-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                 <div className="absolute inset-0 rounded-none border-[16px] border-emerald-500 dark:border-emerald-600" style={{ clipPath: `inset(0 0 0 ${100 - financialStats.paidPercent}%)` }}></div>
                 <div className="absolute inset-0 rounded-none border-[16px] border-rose-500 dark:border-rose-700 opacity-20"></div>
                 <div className="text-center">
                   <div className="text-4xl font-black text-slate-900 dark:text-white">{financialStats.paidPercent}%</div>
                   <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Коммерция</div>
                 </div>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-none bg-emerald-500"></span> Платные
                </span>
                <span className="font-black text-slate-900 dark:text-white">{financialStats.paid}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-none bg-rose-500"></span> Бесплатные
                </span>
                <span className="font-black text-slate-900 dark:text-white">{financialStats.free}</span>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Загруженность специалистов</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">Рейтинг сотрудников по кол-ву профильных смен</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-none border border-slate-100 dark:border-slate-700">
               <UsersIcon className="w-4 h-4 text-slate-400 dark:text-slate-600" />
               <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-tighter">Специалистов: {staffWorkload.length}</span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar">
            <div className="space-y-2">
               {staffWorkload.length > 0 ? staffWorkload.map((staff, idx) => (
                 <div key={staff.name} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-none group">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-none text-[10px] font-black text-slate-400 dark:text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       {idx + 1}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-end mb-2">
                          <span className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{staff.name}</span>
                          <span className="text-[10px] font-black text-slate-900 dark:text-white">{staff.total} <span className="text-slate-400 dark:text-slate-600 font-bold uppercase ml-0.5">смен</span></span>
                       </div>
                       <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-none flex overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 dark:bg-emerald-600 transition-all" 
                            style={{ width: `${(staff.paid / staff.total) * 100}%` }}
                          ></div>
                          <div 
                            className="h-full bg-rose-400 dark:bg-rose-600 transition-all" 
                            style={{ width: `${(staff.free / staff.total) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="py-20 text-center text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest text-xs">Нет данных</div>
               )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-none border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Смены по ролям</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">Распределение нагрузки по должностям</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-none">
              <button onClick={() => setActiveStaffTab('paid')} className={`px-5 py-2 rounded-none text-xs font-bold uppercase transition-all ${activeStaffTab === 'paid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Коммерция</button>
              <button onClick={() => setActiveStaffTab('free')} className={`px-5 py-2 rounded-none text-xs font-bold uppercase transition-all ${activeStaffTab === 'free' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Бюджет</button>
            </div>
          </div>

          <div className="p-4">
            {currentBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentBreakdown.map(r => (
                  <div key={r.role} className="p-5 rounded-none bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">{r.role}</span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-600">{r.total} смен</span>
                    </div>
                    <div className="space-y-2">
                      {r.workers.map((w: any) => (
                        <div key={w.name} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{w.name}</span>
                          <div className="flex items-center gap-2">
                             <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
                               <div className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-none" style={{ width: `${(w.count / r.total) * 100}%` }}></div>
                             </div>
                             <span className="text-[10px] font-black text-slate-900 dark:text-white">{w.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-300 dark:text-slate-700 italic text-sm font-bold uppercase tracking-widest">В этом месяце нет данных</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsView;
