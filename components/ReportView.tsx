
import React, { useMemo, useState, useEffect } from 'react';
import { ConcertEvent, StaffDirectory, User } from '../types';
import { storage } from '../services/storage';
import { ChevronLeft, ChevronRight } from './Icons';

interface ReportViewProps {
  events: ConcertEvent[];
  currentDate: Date;
}

const ReportView: React.FC<ReportViewProps> = ({ events, currentDate }) => {
  const [reportType, setReportType] = useState<'month' | 'week'>('month');
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [settings, setSettings] = useState<StaffDirectory | null>(null);

  const currentUser = useMemo(() => storage.getAuth(), []);

  useEffect(() => {
    setViewDate(new Date(currentDate));
    storage.getStaffDirectory().then(setSettings);
  }, [currentDate]);

  const formatName = (fullName: string): string => {
    if (!fullName || !fullName.trim()) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    
    if (parts.length >= 3) {
      return `${parts[1][0]}.${parts[2][0]}. ${parts[0]}`;
    }
    if (parts.length === 2) {
      return `${parts[1][0]}. ${parts[0]}`;
    }
    return fullName;
  };

  const { filteredEvents, weekRangeText } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const activeEvents = events;

    if (reportType === 'month') {
      const filtered = activeEvents
        .filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { filteredEvents: filtered, weekRangeText: '' };
    } else {
      const startOfWeek = new Date(viewDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(startOfWeek.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const filtered = activeEvents
        .filter(e => {
          const d = new Date(e.date);
          return d >= monday && d <= sunday;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const rangeText = `${monday.toLocaleDateString('ru-RU')} — ${sunday.toLocaleDateString('ru-RU')}`;
      return { filteredEvents: filtered, weekRangeText: rangeText };
    }
  }, [events, viewDate, reportType]);

  const monthName = viewDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const activeRoles = settings?.roles || [];

  const navigate = (direction: number) => {
    const nextDate = new Date(viewDate);
    if (reportType === 'month') {
      nextDate.setMonth(nextDate.getMonth() + direction);
    } else {
      nextDate.setDate(nextDate.getDate() + (direction * 7));
    }
    setViewDate(nextDate);
  };

  const getShortRoleName = (role: string) => {
    const mapping: Record<string, string> = {
      'Администратор': 'Адм.',
      'Отв. за без-сть': 'Безоп.',
      'Звукорежиссер': 'Звук',
      'Худ. по свету': 'Свет',
      'Видеоинженер': 'Видео',
      'Электрик': 'Электр.',
      'Дежурный': 'Деж.'
    };
    return mapping[role] || role;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-8 min-h-screen print:p-0 transition-colors duration-300">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 no-print">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="w-2 h-10 bg-indigo-600 rounded-none"></span>
              ПЛАН МЕРОПРИЯТИЙ
            </h1>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-500">●</span> {reportType === 'month' ? monthName : weekRangeText}
              </p>
              <button onClick={() => navigate(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-none">
              <button 
                onClick={() => setReportType('month')} 
                className={`px-6 py-2 rounded-none text-[10px] font-black uppercase transition-all ${reportType === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-100/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Месяц
              </button>
              <button 
                onClick={() => setReportType('week')} 
                className={`px-6 py-2 rounded-none text-[10px] font-black uppercase transition-all ${reportType === 'week' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-100/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Неделя
              </button>
            </div>
            
            <button 
              onClick={() => window.print()} 
              className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3.5 rounded-none font-black shadow-2xl hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3 text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Печать плана
            </button>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-40 text-center border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-none no-print">
            <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] text-sm">Нет активных событий для плана</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-[10px] leading-tight print:text-[7px]">
              <thead>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white">
                  <th className="p-3 text-left font-black uppercase tracking-wider w-20 print:p-1.5 border border-slate-900 dark:border-slate-800">Дата</th>
                  <th className="p-3 text-left font-black uppercase tracking-wider print:p-1.5 border border-slate-900 dark:border-slate-800">Название / Площадка</th>
                  {activeRoles.map(role => (
                    <th key={role} className="p-2 text-center font-black uppercase tracking-wider border border-slate-700 dark:border-slate-800 print:p-1">
                      <span className="print:hidden">{role}</span>
                      <span className="hidden print:inline">{getShortRoleName(role)}</span>
                    </th>
                  ))}
                  <th className="p-3 text-left font-black uppercase tracking-wider w-32 border border-slate-900 dark:border-slate-800 print:p-1.5">Прим.</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr 
                    key={event.id} 
                    className={`border border-slate-200 dark:border-slate-800 ${
                      event.isPaid 
                        ? 'bg-emerald-50/20 dark:bg-emerald-500/5' 
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <td className="p-3 align-middle font-black text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 print:p-1">
                      <div className="flex flex-col">
                        <span className="text-xs print:text-[8px]">{new Date(event.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 print:text-[6px]">{event.startTime}</span>
                      </div>
                    </td>
                    <td className="p-3 align-middle border border-slate-200 dark:border-slate-800 print:p-1">
                      <div className="font-black text-slate-900 dark:text-white uppercase mb-0.5 print:mb-0">{event.title}</div>
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase print:text-[6px]">{event.venue}</div>
                    </td>
                    {activeRoles.map(role => (
                      <td key={role} className="p-2 text-center align-middle border border-slate-200 dark:border-slate-800 print:p-1">
                        <div className="text-slate-800 dark:text-slate-200 font-bold whitespace-normal">
                          {formatName(event.staff[role]) || <span className="text-slate-200 dark:text-slate-800">—</span>}
                        </div>
                      </td>
                    ))}
                    <td className="p-3 align-middle border border-slate-200 dark:border-slate-800 print:p-1">
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight print:text-[6px]">
                        {event.notes || ''}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="hidden print:flex justify-between items-center mt-6 text-[8px] font-bold uppercase text-slate-400">
           <span>Система учета: {currentUser?.username || 'СДДТ'}</span>
           <span>Сгенерировано: {new Date().toLocaleDateString('ru-RU')} {new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
