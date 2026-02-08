
import React from 'react';
import { ConcertEvent } from '../types';
import { ChevronLeft, ChevronRight, MusicIcon } from './Icons';

interface CalendarViewProps {
  events: ConcertEvent[];
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onEventClick: (event: ConcertEvent) => void;
  onDayClick: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onEventClick,
  onDayClick
}) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  let firstDay = startOfMonth.getDay();
  if (firstDay === 0) firstDay = 7;
  const padding = firstDay - 1;

  const days: (Date | null)[] = [];
  for (let i = 0; i < padding; i++) days.push(null);
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }
  
  const totalCells = days.length > 35 ? 42 : 35;
  while (days.length < totalCells) days.push(null);

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return events.filter(e => e.date === dateStr);
  };

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const yearName = currentDate.getFullYear();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
      {/* Хедер календаря */}
      <div className="p-6 flex items-center justify-between no-print border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">{monthName}</h2>
             <span className="text-xl font-medium text-slate-300 dark:text-slate-700">{yearName}</span>
          </div>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">График мероприятий дворца</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <button 
            onClick={onPrevMonth} 
            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-all rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
          <button 
            onClick={onNextMonth} 
            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-all rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Сетка названий дней */}
      <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
        {daysOfWeek.map((day, idx) => (
          <div key={day} className={`py-3 text-center text-[10px] font-bold uppercase tracking-widest ${idx >= 5 ? 'text-rose-500' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Основная сетка дат - gap-px создает тонкие линии разметки */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 overflow-y-auto custom-scrollbar border-b border-slate-100 dark:border-slate-800">
        {days.map((date, idx) => {
          if (!date) {
            return (
              <div key={`pad-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/40 min-h-[180px]" />
            );
          }
          
          const dayEvents = getEventsForDay(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const isWeekend = idx % 7 >= 5;

          return (
            <div 
              key={date.getTime()} 
              onClick={() => onDayClick(date)}
              className={`
                relative flex flex-col p-3 transition-all cursor-pointer group min-h-[180px]
                ${isToday 
                  ? 'bg-indigo-50/30 dark:bg-indigo-950/20 z-10 ring-1 ring-inset ring-indigo-500' 
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }
              `}
            >
              {/* Число */}
              <div className="flex justify-between items-center mb-3">
                <span className={`
                  text-base font-bold tabular-nums w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${isToday 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : isWeekend ? 'text-rose-500' : 'text-slate-400 dark:text-slate-600 group-hover:text-indigo-600'
                  }
                `}>
                  {date.getDate()}
                </span>
                
                {dayEvents.length > 0 && (
                  <div className="flex -space-x-1 no-print">
                     {dayEvents.slice(0, 3).map(e => (
                       <div 
                        key={e.id} 
                        className={`w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                          e.isCancelled ? 'bg-slate-400' : (e.isPaid ? 'bg-emerald-500' : 'bg-rose-500')
                        }`} 
                       />
                     ))}
                  </div>
                )}
              </div>
              
              {/* Список событий */}
              <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }} 
                    className={`
                      group/ev relative p-2 rounded-lg border transition-all
                      ${event.isCancelled 
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 line-through' 
                        : (event.isPaid 
                            ? 'bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-100/50 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-rose-50/40 dark:bg-rose-500/5 border-rose-100/50 dark:border-rose-500/20 text-rose-800 dark:text-rose-300')
                      }
                      hover:shadow-sm
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${event.isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold opacity-60 tabular-nums text-[9px] leading-none mb-1">{event.startTime}</span>
                        <span className="text-[11px] font-medium leading-snug whitespace-normal break-words">{event.title}</span>
                        {event.venue && (
                            <span className="text-[8px] font-medium opacity-40 uppercase tracking-tighter mt-0.5 truncate">{event.venue}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="px-6 py-3 flex items-center gap-6 no-print shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Платные</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Бюджет</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Отмена</span>
         </div>
      </div>
    </div>
  );
};

export default CalendarView;
