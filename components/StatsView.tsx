
import React, { useMemo, useState } from 'react';
import { ConcertEvent, StaffRole } from '../types';
import { UsersIcon } from './Icons';

interface StatsViewProps {
  events: ConcertEvent[];
  currentDate: Date;
}

const StatsView: React.FC<StatsViewProps> = ({ events, currentDate }) => {
  const [activeStaffTab, setActiveStaffTab] = useState<'paid' | 'free'>('paid');
  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthlyEvents = useMemo(() => events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }), [events, year, month]);

  const financialStats = useMemo(() => {
    const paid = monthlyEvents.filter(e => e.isPaid).length;
    const free = monthlyEvents.filter(e => !e.isPaid).length;
    const total = monthlyEvents.length || 1;
    return { paid, free, paidPercent: Math.round((paid / total) * 100), freePercent: Math.round((free / total) * 100) };
  }, [monthlyEvents]);

  const getRoleBreakdown = (eventList: ConcertEvent[]) => {
    const breakdown: any = {};
    Object.values(StaffRole).forEach(role => breakdown[role] = {});
    eventList.forEach(event => {
      Object.entries(event.staff).forEach(([role, name]) => {
        if (name && name.trim()) breakdown[role][name] = (breakdown[role][name] || 0) + 1;
      });
    });
    return Object.entries(breakdown).map(([role, counts]: [any, any]) => ({
      role,
      workers: Object.entries(counts).map(([name, count]: [any, any]) => ({ name, count })).sort((a, b) => b.count - a.count),
      total: Object.values(counts).reduce((a: any, b: any) => a + b, 0) as number
    })).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
  };

  const roleBreakdownPaid = useMemo(() => getRoleBreakdown(monthlyEvents.filter(e => e.isPaid)), [monthlyEvents]);
  const roleBreakdownFree = useMemo(() => getRoleBreakdown(monthlyEvents.filter(e => !e.isPaid)), [monthlyEvents]);

  if (monthlyEvents.length === 0) return null;

  const currentBreakdown = activeStaffTab === 'paid' ? roleBreakdownPaid : roleBreakdownFree;

  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Аналитика периода</h2>
          <p className="text-slate-500 font-medium mt-1">Данные за {monthName}</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Всего мероприятий</div>
            <div className="text-2xl font-black text-slate-900">{monthlyEvents.length}</div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Платные</div>
            <div className="text-2xl font-black text-emerald-600">{financialStats.paid}</div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Бесплатные</div>
            <div className="text-2xl font-black text-rose-600">{financialStats.free}</div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Персонал</div>
            <div className="text-2xl font-black text-indigo-600">{new Set(monthlyEvents.flatMap(e => Object.values(e.staff))).size - 1}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KPI: Efficiency Chart */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Статистика</h3>
             <p className="text-sm text-slate-400">Соотношение типов мероприятий</p>
           </div>
           
           <div className="py-10 flex flex-col items-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                 {/* Simple custom donut visualization using border and rotation */}
                 <div className="absolute inset-0 rounded-full border-[16px] border-emerald-500" style={{ clipPath: `inset(0 0 0 ${100 - financialStats.paidPercent}%)` }}></div>
                 <div className="absolute inset-0 rounded-full border-[16px] border-rose-500 opacity-20"></div>
                 <div className="text-center">
                   <div className="text-4xl font-black text-slate-900">{financialStats.paidPercent}%</div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Коммерция</div>
                 </div>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Платные
                </span>
                <span className="font-black text-slate-900">{financialStats.paid}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Бесплатные
                </span>
                <span className="font-black text-slate-900">{financialStats.free}</span>
              </div>
           </div>
        </div>

        {/* Staff Breakdown Table with Tabs */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Смены персонала</h3>
              <p className="text-sm text-slate-400">Распределение нагрузки по категориям</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveStaffTab('paid')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeStaffTab === 'paid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Коммерция</button>
              <button onClick={() => setActiveStaffTab('free')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeStaffTab === 'free' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Бюджет</button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar">
            {currentBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentBreakdown.map(r => (
                  <div key={r.role} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{r.role}</span>
                      <span className="text-xs font-bold text-slate-400">{r.total} смен</span>
                    </div>
                    <div className="space-y-2">
                      {r.workers.map((w: any) => (
                        <div key={w.name} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{w.name}</span>
                          <div className="flex items-center gap-2">
                             <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(w.count / r.total) * 100}%` }}></div>
                             </div>
                             <span className="text-[10px] font-black text-slate-900">{w.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-300 italic text-sm">Нет данных по этой категории</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsView;
