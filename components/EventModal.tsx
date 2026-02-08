
import React, { useState, useEffect } from 'react';
import { ConcertEvent, StaffAssignment, StaffDirectory, Employee, NotificationSettings, RentedEquipment, User } from '../types';
import { storage } from '../services/storage';
import { ClockIcon, UsersIcon, TableIcon, TrashIcon, PlusIcon, CalendarIcon, LinkIcon } from './Icons';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: (id: string) => Promise<void>;
  eventToEdit: ConcertEvent | null;
  initialDate?: Date;
  canEdit: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, eventToEdit, initialDate, canEdit }) => {
  const [settings, setSettings] = useState<StaffDirectory>({ employees: [], venues: [], roles: [], departments: [], cabinets: [], phoneRecords: [], equipmentCatalog: [], birthdays: [] });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<Omit<ConcertEvent, 'id'>>({
    title: '', date: '', arrivalTime: '14:00', soundcheckTime: '16:00', doorsTime: '18:30',
    startTime: '19:00', venue: '', notes: '', rider: '', isPaid: true, isCancelled: false, staff: {}, rentedEquipment: []
  });

  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      storage.getStaffDirectory().then(s => {
        setSettings(s);
        setCurrentUser(storage.getAuth());

        if (eventToEdit) {
          setFormData({ 
            ...eventToEdit, 
            rentedEquipment: eventToEdit.rentedEquipment || [],
            isCancelled: !!eventToEdit.isCancelled 
          });
        } else {
          setFormData({
            title: '',
            date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            arrivalTime: '14:00', soundcheckTime: '16:00', doorsTime: '18:30', startTime: '19:00',
            venue: s.venues?.[0] || '',
            notes: '', rider: '', isPaid: true, isCancelled: false, 
            // АВТОЗАПОЛНЕНИЕ: Технический специалист по умолчанию
            staff: { 'Технический специалист': 'Агайгельдиев Руслан Магометович' }, 
            rentedEquipment: []
          });
        }
      });
    }
  }, [eventToEdit, initialDate, isOpen]);

  const copyArtistLink = () => {
    if (!eventToEdit) return;
    const url = `${window.location.origin}${window.location.pathname}?event_id=${eventToEdit.id}`;
    navigator.clipboard.writeText(url);
    alert('Персональная ссылка для артиста скопирована!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    try {
      const eventId = eventToEdit?.id || crypto.randomUUID();
      const eventData = { ...formData, id: eventId } as ConcertEvent;

      if (eventToEdit) await storage.updateEvent(eventData);
      else await storage.addEvent(eventData);

      const [registry, cancelledRegistry] = await Promise.all([
        storage.getRentalsRegistry(),
        storage.getCancelledEventsRegistry()
      ]);

      registry[eventId] = formData.rentedEquipment || [];
      await storage.saveRentalsRegistry(registry);

      if (formData.isCancelled) cancelledRegistry[eventId] = true;
      else delete cancelledRegistry[eventId];
      await storage.saveCancelledEventsRegistry(cancelledRegistry);
      
      onSave();
      onClose();
    } catch (err: any) { 
      setApiError(err.message || 'Ошибка сохранения'); 
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-slate-900/40 backdrop-blur-lg">
      <div className="bg-white/95 dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative border border-white/20 dark:border-slate-800 animate-slide-in">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl ${formData.isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <CalendarIcon className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {eventToEdit ? 'Редактирование' : 'Новое событие'}
                </h2>
                <p className="text-sm font-medium text-slate-400">Управление параметрами и персоналом</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {eventToEdit && (
               <button type="button" onClick={copyArtistLink} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-slate-400 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                 <LinkIcon className="w-5 h-5" /> Ссылка для артиста
               </button>
             )}
             <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all text-slate-400">
                <PlusIcon className="w-6 h-6 rotate-45" />
             </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar dark:bg-slate-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             <div className="lg:col-span-7 space-y-12">
                <section className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                      <h3 className="font-extrabold text-slate-900 dark:text-white">Основная информация</h3>
                   </div>
                   <div className="space-y-4">
                      <input required readOnly={!canEdit} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-lg transition-all dark:text-white" placeholder="Название мероприятия *" />
                      <div className="grid grid-cols-2 gap-4">
                        <select required disabled={!canEdit} value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white">
                          <option value="">Площадка...</option>
                          {settings.venues.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <input required readOnly={!canEdit} type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" />
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                         <button type="button" onClick={() => canEdit && setFormData({...formData, isPaid: true})} className={`flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all ${formData.isPaid ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Коммерция</button>
                         <button type="button" onClick={() => canEdit && setFormData({...formData, isPaid: false})} className={`flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all ${!formData.isPaid ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Бюджет</button>
                      </div>
                   </div>
                </section>

                <section className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                      <h3 className="font-extrabold text-slate-900 dark:text-white">Тайминг дня</h3>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['arrivalTime', 'soundcheckTime', 'doorsTime', 'startTime'].map((field, idx) => (
                        <div key={field} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                           <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                              {idx === 0 ? 'Заезд' : idx === 1 ? 'Чек' : idx === 2 ? 'Двери' : 'Старт'}
                           </label>
                           <input type="time" value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} className={`w-full text-center bg-transparent font-black text-lg outline-none ${idx === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`} />
                        </div>
                      ))}
                   </div>
                </section>

                <section className="space-y-4">
                   <textarea value={formData.rider} onChange={e => setFormData({...formData, rider: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl h-24 text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500/10 outline-none dark:text-white" placeholder="Технический райдер..." />
                   <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl h-20 text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500/10 outline-none italic dark:text-white" placeholder="Заметки..." />
                </section>
             </div>

             <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                   <div className="flex items-center gap-3 mb-8">
                      <UsersIcon className="w-6 h-6 text-indigo-600" />
                      <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight">Персонал на смену</h3>
                   </div>
                   <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                      {settings.roles.map(role => (
                        <div key={role} className="group">
                           <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 transition-colors group-focus-within:text-indigo-600">{role}</label>
                           <select 
                            disabled={!canEdit} 
                            value={formData.staff[role] || ''} 
                            onChange={e => setFormData({...formData, staff: {...formData.staff, [role]: e.target.value}})} 
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all dark:text-white"
                           >
                            <option value="">—</option>
                            {settings.employees
                              .filter(emp => emp.roles.includes(role) || (role === 'Дежурный' && emp.roles.length > 0))
                              .map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)
                            }
                           </select>
                        </div>
                      ))}
                   </div>
                </div>
                
                {eventToEdit && canEdit && (
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isCancelled: !formData.isCancelled})}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${
                        formData.isCancelled 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 hover:bg-rose-100'
                    }`}
                  >
                    {formData.isCancelled ? 'Восстановить событие' : 'Отменить мероприятие'}
                  </button>
                )}
             </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
             <button type="button" onClick={onClose} className="px-8 py-4 font-extrabold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Отмена</button>
             {canEdit && (
               <button type="submit" disabled={loading} className="px-12 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  {loading ? 'Синхронизация...' : 'Сохранить изменения'}
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
