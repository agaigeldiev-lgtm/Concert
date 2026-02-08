
import React, { useState, useEffect } from 'react';
import { GuestGuide, StaffDirectory } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, TrashIcon, EditIcon, MusicIcon } from './Icons';

const GuestGuidesView: React.FC = () => {
  const [guides, setGuides] = useState<GuestGuide[]>([]);
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Partial<GuestGuide> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [g, dir] = await Promise.all([
      storage.getGuestGuides(),
      storage.getStaffDirectory()
    ]);
    setGuides(g);
    setDirectory(dir);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuide) return;

    const newGuide: GuestGuide = {
      id: editingGuide.id || crypto.randomUUID(),
      title: editingGuide.title || 'Новый путеводитель',
      venue: editingGuide.venue || '',
      welcomeText: editingGuide.welcomeText || '',
      dressingRooms: editingGuide.dressingRooms || '',
      venueTechSpecs: editingGuide.venueTechSpecs || '',
      yandexMapsUrl: editingGuide.yandexMapsUrl || '',
      wifiSsid: editingGuide.wifiSsid || 'SDDT_GUEST',
      wifiPass: editingGuide.wifiPass || '',
      entrancePhotoUrl: editingGuide.entrancePhotoUrl || '',
      stagePlanUrl: editingGuide.stagePlanUrl || '',
      techContactName: editingGuide.techContactName || '',
      techContactPhone: editingGuide.techContactPhone || '',
      securityContactName: editingGuide.securityContactName || '',
      securityContactPhone: editingGuide.securityContactPhone || '',
      cateringInfo: editingGuide.cateringInfo || '',
      loadingInfo: editingGuide.loadingInfo || '',
      showParkingReminder: editingGuide.showParkingReminder ?? true,
      showRiderReminder: editingGuide.showRiderReminder ?? true,
      isActive: editingGuide.isActive !== undefined ? editingGuide.isActive : true,
      updatedAt: new Date().toISOString()
    };

    const updated = editingGuide.id 
      ? guides.map(g => g.id === newGuide.id ? newGuide : g)
      : [newGuide, ...guides];

    setGuides(updated);
    await storage.saveGuestGuides(updated);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить путеводитель? Эта операция необратима.')) return;
    const updated = guides.filter(g => g.id !== id);
    setGuides(updated);
    await storage.saveGuestGuides(updated);
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?guide=${id}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка на гид для артиста скопирована!');
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
             <MusicIcon className="w-8 h-8 text-indigo-600" /> Гиды для артистов
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Создание персональных страниц для приглашенных коллективов</p>
        </div>
        <button onClick={() => { setEditingGuide({ isActive: true, showParkingReminder: true, showRiderReminder: true }); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-10 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-indigo-200 transition-transform active:scale-95">
          <PlusIcon className="w-5 h-5" /> Новый гид
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full py-20 text-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-4 rounded-full"></div>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Загрузка данных...</p>
            </div>
        ) : guides.length === 0 ? (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100">
                <MusicIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-300 font-black uppercase tracking-widest">Список путеводителей пуст</p>
            </div>
        ) : guides.map(guide => (
          <div key={guide.id} className="bg-white border border-slate-100 p-8 flex flex-col gap-6 group hover:shadow-2xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
                <div className={`w-3 h-3 rounded-full ${guide.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            </div>
            
            <div className="flex justify-between items-start">
               <span className={`text-[9px] font-black uppercase px-2 py-1 border ${guide.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                 {guide.isActive ? 'Активен' : 'Архив'}
               </span>
               <button onClick={() => copyLink(guide.id)} className="text-[9px] font-black text-indigo-600 uppercase border-b-2 border-indigo-100 hover:border-indigo-600 transition-all pb-0.5">Копировать ссылку</button>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{guide.title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">📍 {guide.venue}</p>
            </div>
            
            <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
               <div className="flex gap-2">
                 <button onClick={() => { setEditingGuide(guide); setIsModalOpen(true); }} className="p-3 text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-100" title="Редактировать"><EditIcon className="w-5 h-5" /></button>
                 <button onClick={() => handleDelete(guide.id)} className="p-3 text-rose-600 hover:bg-rose-50 transition-colors border border-rose-100" title="Удалить"><TrashIcon className="w-5 h-5" /></button>
               </div>
               <a href={`${window.location.origin}${window.location.pathname}?guide=${guide.id}`} target="_blank" className="text-[10px] font-black uppercase text-white bg-slate-900 px-6 py-3 hover:bg-indigo-600 transition-colors">Предпросмотр</a>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t-8 border-indigo-600">
             <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Конструктор путеводителя артиста</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Заполните данные для формирования гостевого портала</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2"><PlusIcon className="w-9 h-9 rotate-45" /></button>
             </div>
             
             <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                {/* Общие данные */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-black text-xs">01</span>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Основные сведения</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Название (Коллектив / Событие)</label>
                        <input required value={editingGuide?.title || ''} onChange={e => setEditingGuide({...editingGuide!, title: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 font-bold outline-none focus:border-indigo-500" placeholder="Напр. Группа 'Ритмы Жизни'" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Площадка проведения</label>
                        <select required value={editingGuide?.venue || ''} onChange={e => setEditingGuide({...editingGuide!, venue: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 font-bold outline-none focus:border-indigo-500">
                        <option value="">Выберите из справочника...</option>
                        {directory?.venues.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Приветственное слово (на главной странице)</label>
                      <textarea value={editingGuide?.welcomeText || ''} onChange={e => setEditingGuide({...editingGuide!, welcomeText: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 text-sm h-24 resize-none outline-none focus:border-indigo-500 italic" placeholder="Напр. Рады приветствовать вас в нашем концертном зале! Желаем отличного выступления..." />
                   </div>
                   <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Ссылка на Яндекс.Карты (для построения маршрута)</label>
                        <input value={editingGuide?.yandexMapsUrl || ''} onChange={e => setEditingGuide({...editingGuide!, yandexMapsUrl: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" placeholder="https://yandex.ru/maps/..." />
                    </div>
                </div>

                {/* Техническая информация */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-amber-600 text-white flex items-center justify-center font-black text-xs">02</span>
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-600">Техническая информация</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 block">Ссылка на схему сцены (URL фото)</label>
                        <input value={editingGuide?.stagePlanUrl || ''} onChange={e => setEditingGuide({...editingGuide!, stagePlanUrl: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-amber-100 font-bold text-xs" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 block">Технический ответственный (ФИО)</label>
                        <input value={editingGuide?.techContactName || ''} onChange={e => setEditingGuide({...editingGuide!, techContactName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-amber-100 font-bold text-xs" placeholder="Напр. Иван Петров" />
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 block">Технические характеристики (звук, свет, сцена)</label>
                      <textarea value={editingGuide?.venueTechSpecs || ''} onChange={e => setEditingGuide({...editingGuide!, venueTechSpecs: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-amber-100 text-xs italic h-32 resize-none font-mono" placeholder="Звук: 10кВт, Свет: 24 прибора, Сцена: 8х6 метров..." />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 block">Телефон инженера</label>
                        <input value={editingGuide?.techContactPhone || ''} onChange={e => setEditingGuide({...editingGuide!, techContactPhone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-amber-100 font-bold text-xs" placeholder="+7..." />
                      </div>
                      <div className="flex items-center gap-3 bg-rose-50 p-4 border border-rose-100">
                        <input type="checkbox" checked={editingGuide?.showRiderReminder ?? true} onChange={e => setEditingGuide({...editingGuide!, showRiderReminder: e.target.checked})} className="w-5 h-5 accent-rose-600" />
                        <span className="text-[10px] font-black uppercase text-rose-700 tracking-widest">Напоминать о райдере</span>
                      </div>
                   </div>
                </div>

                {/* Бытовая информация */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-indigo-600 text-white flex items-center justify-center font-black text-xs">03</span>
                      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">Бытовая информация</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">Номера гримерок (через запятую)</label>
                        <input value={editingGuide?.dressingRooms || ''} onChange={e => setEditingGuide({...editingGuide!, dressingRooms: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-indigo-100 font-bold text-xs" placeholder="№101, №102, VIP" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">Имя Wi-Fi (SSID)</label>
                           <input value={editingGuide?.wifiSsid || ''} onChange={e => setEditingGuide({...editingGuide!, wifiSsid: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-indigo-100 font-mono text-xs" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">Пароль Wi-Fi</label>
                           <input value={editingGuide?.wifiPass || ''} onChange={e => setEditingGuide({...editingGuide!, wifiPass: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-indigo-100 font-mono text-xs" />
                        </div>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">Питание и бытовые условия (кулер, утюг, чайник)</label>
                      <textarea value={editingGuide?.cateringInfo || ''} onChange={e => setEditingGuide({...editingGuide!, cateringInfo: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-indigo-100 text-xs italic h-24 resize-none" placeholder="Вода и чай в гримерках, утюг в 101-й комнате, столовая на 1 этаже..." />
                   </div>
                </div>

                {/* Логистика и охрана */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-slate-400 text-white flex items-center justify-center font-black text-xs">04</span>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Логистика и охрана</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Фото служебного входа (URL)</label>
                        <input value={editingGuide?.entrancePhotoUrl || ''} onChange={e => setEditingGuide({...editingGuide!, entrancePhotoUrl: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" placeholder="https://..." />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Ответственный за охрану</label>
                         <input value={editingGuide?.securityContactName || ''} onChange={e => setEditingGuide({...editingGuide!, securityContactName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" placeholder="ФИО или 'Дежурный'" />
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Правила заезда и разгрузки</label>
                      <textarea value={editingGuide?.loadingInfo || ''} onChange={e => setEditingGuide({...editingGuide!, loadingInfo: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 text-xs italic h-24 resize-none" placeholder="Заезд со двора через шлагбаум, ворота открываются по звонку..." />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Телефон охраны / дежурного</label>
                            <input value={editingGuide?.securityContactPhone || ''} onChange={e => setEditingGuide({...editingGuide!, securityContactPhone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" />
                        </div>
                        <div className="flex items-center gap-3 bg-indigo-50 p-4 border border-indigo-100">
                            <input type="checkbox" checked={editingGuide?.showParkingReminder ?? true} onChange={e => setEditingGuide({...editingGuide!, showParkingReminder: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Напоминать о парковке</span>
                        </div>
                   </div>
                </div>

                <div className="flex justify-end gap-4 pt-10 border-t sticky bottom-0 bg-white z-10 p-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Закрыть</button>
                   <button type="submit" className="px-16 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Опубликовать путеводитель</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestGuidesView;
