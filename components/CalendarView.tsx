
import React from 'react';
import { ConcertEvent } from '../types';
import { ChevronLeft, ChevronRight, ClockIcon } from './Icons';

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
  while (days.length < 42) days.push(null);

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="overflow-hidden">
      <div className="p-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{monthName}</h2>
          <p className="text-sm font-medium text-slate-400 mt-1">График загрузки площадок</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={onPrevMonth} className="p-2.5 hover:bg-white hover:shadow-sm text-slate-500 hover:text-indigo-600 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={onNextMonth} className="p-2.5 hover:bg-white hover:shadow-sm text-slate-500 hover:text-indigo-600 rounded-xl transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-y border-slate-100">
        {daysOfWeek.map((day, idx) => (
          <div key={day} className={`py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] ${idx >= 5 ? 'text-rose-500 bg-rose-50/20' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((date, idx) => {
          if (!date) return <div key={`pad-${idx}`} className="border-r border-b border-slate-50 bg-slate-50/30 h-32" />;
          
          const dayEvents = getEventsForDay(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const isWeekend = idx % 7 >= 5;

          return (
            <div 
              key={date.toISOString()} 
              onClick={() => onDayClick(date)}
              className={`border-r border-b border-slate-100 p-3 min-h-[140px] transition-all cursor-pointer group flex flex-col relative ${isWeekend ? 'bg-slate-50/30' : 'bg-white'} hover:bg-indigo-50/40`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                  isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 group-hover:text-indigo-600'
                }`}>
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex -space-x-1">
                     {dayEvents.slice(0, 3).map(e => (
                       <div key={e.id} className={`w-2 h-2 rounded-full border border-white ring-1 ${e.isPaid ? 'bg-emerald-500 ring-emerald-100' : 'bg-rose-500 ring-rose-100'}`}></div>
                     ))}
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-1.5">
                {dayEvents.slice(0, 3).map(event => (
                  <div key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} className={`p-1.5 text-[9px] font-bold border rounded-lg truncate transition-all ${
                    event.isPaid ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-rose-50/50 border-rose-100 text-rose-700'
                  } hover:scale-[1.02] hover:shadow-sm`}>
                    {event.startTime} • {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[8px] font-black text-slate-300 uppercase pl-1"> еще {dayEvents.length - 3}... </div>
                )}
              </div>
              
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
