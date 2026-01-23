
import React from 'react';
import { ConcertEvent, StaffRole } from '../types';
import { EditIcon, TrashIcon, ClockIcon, UsersIcon } from './Icons';

interface ListViewProps {
  events: ConcertEvent[];
  onEdit: (event: ConcertEvent) => void;
  onDelete: (id: string) => void;
}

const ListView: React.FC<ListViewProps> = ({ events, onEdit, onDelete }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ClockIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Мероприятий пока нет</h3>
        <p className="text-slate-500">Добавьте свое первое событие через кнопку "Новое мероприятие"</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Мероприятие</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Тип</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Тайминг</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Персонал</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEvents.map(event => (
              <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900">{event.title}</div>
                  <div className="text-xs text-slate-500">{new Date(event.date).toLocaleDateString('ru-RU')} • {event.venue || 'Без места'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    event.isPaid 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {event.isPaid ? 'Платное' : 'Беспл.'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] flex items-center gap-1.5 text-slate-600">
                      <span className="w-12 opacity-60">Заезд:</span>
                      <span className="font-semibold">{event.arrivalTime}</span>
                    </div>
                    <div className="text-[11px] flex items-center gap-1.5 text-indigo-600">
                      <span className="w-12 opacity-60">Шоу:</span>
                      <span className="font-bold">{event.startTime}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-w-xs">
                    {(Object.entries(event.staff) as [string, string][]).slice(0, 4).map(([role, name]) => (
                      <div key={role} className="text-[10px] truncate">
                        <span className="text-slate-400 mr-1">{role.slice(0, 3)}:</span>
                        <span className={name ? 'text-slate-700 font-medium' : 'text-slate-300 italic'}>
                          {name ? name.split(' ')[0] : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(event)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Удалить это мероприятие?')) onDelete(event.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
