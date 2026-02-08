
import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, VehicleCategory } from '../types';
import { storage } from '../services/storage';
import { 
  CarIcon, PlusIcon, EditIcon, TrashIcon, PrinterIcon, ClockIcon,
  BriefcaseIcon, StarIcon, LifeBuoyIcon, SirenIcon, PulseIcon
} from './Icons';
import VehicleModal from './VehicleModal';

const CATEGORY_MAP: Record<VehicleCategory, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  staff: { 
    label: 'Сотрудник', 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: <BriefcaseIcon className="w-3.5 h-3.5" />
  },
  guest: { 
    label: 'Гость/Артист', 
    color: 'text-amber-600 dark:text-amber-400', 
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: <StarIcon className="w-3.5 h-3.5" />
  },
  service: { 
    label: 'Техслужба', 
    color: 'text-purple-600 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: <LifeBuoyIcon className="w-3.5 h-3.5" />
  },
  emergency: { 
    label: 'Спецтранспорт', 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: <SirenIcon className="w-3.5 h-3.5" />
  }
};

const ParkingView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<VehicleCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await storage.getParkingList();
      const sanitized = (data || []).map(v => ({ ...v, category: v.category || 'staff' }));
      setVehicles(sanitized);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      expected: vehicles.filter(v => v.isExpectedToday).length,
      staff: vehicles.filter(v => v.category === 'staff').length,
      guests: vehicles.filter(v => v.category === 'guest').length
    };
  }, [vehicles]);

  const filtered = useMemo(() => {
    let result = vehicles;
    if (activeCategory !== 'all') {
      result = result.filter(v => v.category === activeCategory);
    }
    const q = search.toLowerCase();
    return result.filter(v => 
      (v.ownerName || '').toLowerCase().includes(q) || 
      (v.plateNumber || '').toLowerCase().includes(q) ||
      (v.department || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q)
    ).sort((a,b) => {
      if (a.isExpectedToday && !b.isExpectedToday) return -1;
      if (!a.isExpectedToday && b.isExpectedToday) return 1;
      return (a.ownerName || '').localeCompare(b.ownerName || '');
    });
  }, [vehicles, search, activeCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить автомобиль из базы допуска?')) return;
    const newList = vehicles.filter(v => v.id !== id);
    setVehicles(newList);
    await storage.saveParkingList(newList);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Категория', 'Владелец', 'Отдел', 'Марка', 'Госномер', 'Телефон', 'Примечание'];
    const rows = filtered.map(v => [
        CATEGORY_MAP[v.category]?.label || v.category,
        v.ownerName,
        v.department,
        v.model,
        v.plateNumber,
        v.phone,
        v.notes
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parking_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 transition-colors duration-300 min-h-full flex flex-col">
      {/* Dashboard Summary */}
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 no-print">
         {[
           { label: 'Всего в базе', value: stats.total, icon: <CarIcon className="w-6 h-6" />, color: 'indigo' },
           { label: 'Ожидаются сегодня', value: stats.expected, icon: <ClockIcon className="w-6 h-6" />, color: 'emerald' },
           { label: 'Сотрудники', value: stats.staff, icon: <BriefcaseIcon className="w-6 h-6" />, color: 'blue' },
           { label: 'Гости / Артисты', value: stats.guests, icon: <StarIcon className="w-6 h-6" />, color: 'amber' }
         ].map((stat, i) => (
           <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:scale-[1.02]">
              <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-2xl flex items-center justify-center shrink-0`}>
                 {stat.icon}
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                 <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h4>
              </div>
           </div>
         ))}
      </div>

      {/* Modernized Toolbar */}
      <div className="p-8 space-y-6 no-print">
        {/* Top Row: Navigation and Main Action */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[20px] overflow-x-auto no-scrollbar max-w-full">
              <button 
                onClick={() => setActiveCategory('all')} 
                className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Все
              </button>
              {Object.entries(CATEGORY_MAP).map(([key, { label, icon }]) => (
                  <button 
                    key={key} 
                    onClick={() => setActiveCategory(key as VehicleCategory)} 
                    className={`px-6 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all ${activeCategory === key ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {icon} {label}
                  </button>
              ))}
          </div>

          <button onClick={handleOpenAdd} className="w-full lg:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-[1.02] active:scale-95">
            <PlusIcon className="w-5 h-5" /> Добавить ТС
          </button>
        </div>

        {/* Bottom Row: Search and Secondary Tools */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
                type="text" 
                placeholder="ПОИСК ПО БАЗЕ (ФИО, НОМЕР, ОТДЕЛ)..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
            />
            <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={exportToCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group"
              title="Экспорт в CSV"
            >
              <svg className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Экспорт</span>
            </button>
            
            <button 
              onClick={() => window.print()} 
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group"
              title="Печать реестра"
            >
              <PrinterIcon className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Печать</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 pt-0">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Синхронизация реестра...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-[40px] flex flex-col items-center">
            <CarIcon className="w-16 h-16 text-slate-100 dark:text-slate-800 mb-6" />
            <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] text-sm">В этом разделе пока пусто</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 no-print pb-20">
            {filtered.map(v => {
              const cat = CATEGORY_MAP[v.category] || CATEGORY_MAP.staff;
              return (
                <div key={v.id} className={`group bg-white dark:bg-slate-800/40 border p-7 rounded-[40px] transition-all hover:shadow-2xl relative overflow-hidden flex flex-col ${v.isExpectedToday ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/5 bg-emerald-50/10 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50'}`}>
                  
                  {v.isExpectedToday && (
                    <div className="absolute top-0 right-0 px-5 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-bl-[20px] shadow-lg animate-pulse flex items-center gap-1.5 z-10">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Ожидается сегодня
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border rounded-xl flex items-center gap-1.5 transition-colors ${cat.color} ${cat.bg} border-current/20`}>
                      {cat.icon}
                      {cat.label}
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => handleOpenEdit(v)} className="p-2.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 rounded-xl transition-all shadow-sm"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 rounded-xl transition-all shadow-sm"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-sm ${v.isExpectedToday ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                        {v.ownerName ? v.ownerName[0].toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">{v.ownerName}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{v.department}</p>
                      </div>
                    </div>

                    <div className={`p-5 rounded-3xl space-y-4 border transition-colors ${v.isExpectedToday ? 'bg-white/80 dark:bg-slate-900/80 border-emerald-100 dark:border-emerald-900/30 shadow-inner' : 'bg-slate-50 dark:bg-slate-900/60 border-transparent'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Транспортное средство</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{v.model}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                         <div className="inline-flex items-center bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 px-4 py-1.5 gap-3 rounded-lg shadow-md transform hover:scale-105 transition-transform">
                            <span className="text-lg font-mono font-black text-slate-900 dark:text-white uppercase">{(v.plateNumber || '').slice(0, -2).toUpperCase()}</span>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex flex-col items-center">
                               <span className="text-[8px] font-black text-slate-400 leading-none">RUS</span>
                               <span className="text-xs font-mono font-black text-slate-900 dark:text-white leading-none">{(v.plateNumber || '').slice(-2)}</span>
                            </div>
                         </div>
                         
                         <a href={`tel:${v.phone}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {v.phone}
                         </a>
                      </div>
                    </div>

                    {v.notes && (
                      <div className="px-2">
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Служебная отметка</p>
                        <div className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {v.notes}
                        </div>
                      </div>
                    )}
                    
                    {(v.validUntil || v.isCallEntry) && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                         {v.validUntil && (
                           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg border border-rose-100 dark:border-rose-900/30">
                              <ClockIcon className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase">Пропуск до {new Date(v.validUntil).toLocaleDateString()}</span>
                           </div>
                         )}
                         {v.isCallEntry && (
                           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg border border-amber-100 dark:border-amber-900/30">
                              <PulseIcon className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase">Въезд по звонку</span>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Print Table (Hidden in UI) */}
        <div className="hidden print:block">
            <div className="mb-8 border-b-4 border-slate-900 pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">Реестр ТС для контроля доступа (СДДТ)</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">
                    Дата формирования: {new Date().toLocaleDateString('ru-RU')} | Служба охраны
                </p>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 border border-slate-900 text-[10px] font-black uppercase tracking-wider">Категория</th>
                  <th className="p-3 border border-slate-900 text-[10px] font-black uppercase tracking-wider">Владелец / Отдел</th>
                  <th className="p-3 border border-slate-900 text-[10px] font-black uppercase tracking-wider">Автомобиль / Госномер</th>
                  <th className="p-3 border border-slate-900 text-[10px] font-black uppercase tracking-wider">Контакт</th>
                  <th className="p-3 border border-slate-900 text-[10px] font-black uppercase tracking-wider">Примечание</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const cat = CATEGORY_MAP[v.category] || CATEGORY_MAP.staff;
                  return (
                    <tr key={v.id} className={v.isExpectedToday ? 'bg-slate-100' : ''}>
                      <td className="p-3 border border-slate-200 text-[9px] font-bold uppercase">{cat.label}</td>
                      <td className="p-3 border border-slate-200">
                        <div className="text-[10px] font-black uppercase">{v.ownerName}</div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase">{v.department}</div>
                      </td>
                      <td className="p-3 border border-slate-200">
                        <div className="text-[10px] font-bold">{v.model}</div>
                        <div className="text-[11px] font-mono font-black border border-slate-900 inline-block px-2 mt-1">{(v.plateNumber || '').toUpperCase()}</div>
                      </td>
                      <td className="p-3 border border-slate-200 text-[10px] font-bold">{v.phone}</td>
                      <td className="p-3 border border-slate-200 text-[9px] italic">{v.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      </div>

      <VehicleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={loadVehicles} 
        vehicleToEdit={editingVehicle} 
      />
    </div>
  );
};

export default ParkingView;
