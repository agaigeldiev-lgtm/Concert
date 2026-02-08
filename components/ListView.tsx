
import React from 'react';
import { ConcertEvent } from '../types';
import { EditIcon, TrashIcon, ClockIcon, LinkIcon } from './Icons';

interface ListViewProps {
  events: ConcertEvent[];
  onEdit: (event: ConcertEvent) => void;
  onDelete: (id: string) => Promise<void>;
  canManage: boolean;
}

const ListView: React.FC<ListViewProps> = ({ events, onEdit, onDelete, canManage }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const copyArtistLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?event_id=${id}`;
    navigator.clipboard.writeText(url);
    alert('Персональная ссылка для артиста скопирована!');
  };

  if (events.length === 0) {
    return (
      <div className="p-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
          <ClockIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Мероприятий не найдено</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="space-y-4">
        {sortedEvents.map(event => (
          <div 
            key={event.id} 
            onClick={() => onEdit(event)}
            className={`group bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${event.isCancelled ? 'opacity-50 grayscale' : ''}`}
          >
            {event.isCancelled && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />}
            
            <div className="flex items-center gap-6 flex-1">
              <div className="flex flex-col items-center justify-center min-w-[64px] h-16 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                <span className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{new Date(event.date).getDate()}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{new Date(event.date).toLocaleDateString('ru-RU', { month: 'short' })}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`text-base font-extrabold truncate ${event.isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'}`}>
                    {event.title}
                  </h3>
                  <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${event.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                    {event.isPaid ? 'Коммерция' : 'Бюджет'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{event.venue} • {event.startTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
               <div className="flex -space-x-2">
                  {Object.values(event.staff).filter(Boolean).slice(0, 4).map((name, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase">
                      {name[0]}
                    </div>
                  ))}
               </div>
               <div className="h-10 w-px bg-slate-100 dark:border-slate-800 hidden md:block" />
               <div className="flex gap-1 no-print">
                  <button onClick={(e) => copyArtistLink(e, event.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all" title="Ссылка для артиста">
                    <LinkIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all" title="Редактировать">
                    <EditIcon className="w-5 h-5" />
                  </button>
                  {canManage && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} 
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Удалить"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListView;
