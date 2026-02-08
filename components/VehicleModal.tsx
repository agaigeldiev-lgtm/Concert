
import React, { useState, useEffect } from 'react';
import { Vehicle, StaffDirectory, VehicleCategory } from '../types';
import { storage } from '../services/storage';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vehicleToEdit: Vehicle | null;
}

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: 'staff', label: 'Сотрудник Дворца' },
  { value: 'guest', label: 'Гость / Артист' },
  { value: 'service', label: 'Техническая служба' },
  { value: 'emergency', label: 'Спецтранспорт' },
];

const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onSave, vehicleToEdit }) => {
  const [settings, setSettings] = useState<StaffDirectory | null>(null);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'updatedAt'>>({
    ownerName: '', department: '', model: '', plateNumber: '', phone: '', 
    category: 'staff', notes: '', isCallEntry: false, isExpectedToday: false, validUntil: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      storage.getStaffDirectory().then(setSettings);
      if (vehicleToEdit) {
        setFormData({ 
            ...vehicleToEdit,
            category: vehicleToEdit.category || 'staff',
            validUntil: vehicleToEdit.validUntil || ''
        });
      } else {
        setFormData({ 
            ownerName: '', department: '', model: '', plateNumber: '', phone: '', 
            category: 'staff', notes: '', isCallEntry: false, isExpectedToday: false, validUntil: ''
        });
      }
    }
  }, [isOpen, vehicleToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentList = await storage.getParkingList();
      const newVehicle = { 
        ...formData, 
        id: vehicleToEdit?.id || crypto.randomUUID(),
        updatedAt: new Date().toISOString()
      } as Vehicle;

      let newList;
      if (vehicleToEdit) {
        newList = currentList.map(v => v.id === vehicleToEdit.id ? newVehicle : v);
      } else {
        newList = [...currentList, newVehicle];
      }

      await storage.saveParkingList(newList);
      onSave();
      onClose();
    } catch (e) {
      alert('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[40px] animate-slide-in">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {vehicleToEdit ? 'Параметры допуска' : 'Регистрация транспорта'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Внесение ТС в базу контроля доступа</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all text-slate-400">
                <svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Категория</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as VehicleCategory})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-bold text-slate-900 dark:text-white rounded-2xl">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Действует до (необяз.)</label>
              <input type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-bold text-slate-900 dark:text-white rounded-2xl" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ФИО Владельца / Водителя</label>
                <input required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-bold text-slate-900 dark:text-white rounded-2xl" placeholder="Напр. Иванов И.И." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Отдел / Контрагент</label>
                <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-bold text-slate-900 dark:text-white rounded-2xl" placeholder="Напр. Сценическая служба" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Госномер (цифры и буквы)</label>
                <input required value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-black text-slate-900 dark:text-white rounded-2xl" placeholder="А000АА26" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Марка и цвет</label>
                <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-bold text-slate-900 dark:text-white rounded-2xl" placeholder="Напр. Белая Газель" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Телефон для связи</label>
              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-bold text-slate-900 dark:text-white rounded-2xl" placeholder="+7 (___) ___-__-__" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
             <button type="button" onClick={() => setFormData({...formData, isExpectedToday: !formData.isExpectedToday})} className={`flex-1 p-4 border rounded-2xl flex items-center justify-center gap-3 transition-all ${formData.isExpectedToday ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${formData.isExpectedToday ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {formData.isExpectedToday && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Ожидается сегодня</span>
             </button>
             <button type="button" onClick={() => setFormData({...formData, isCallEntry: !formData.isCallEntry})} className={`flex-1 p-4 border rounded-2xl flex items-center justify-center gap-3 transition-all ${formData.isCallEntry ? 'bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${formData.isCallEntry ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                    {formData.isCallEntry && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Въезд по звонку</span>
             </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Особые примечания для охраны</label>
            <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 text-sm italic font-medium text-slate-900 dark:text-white resize-none" placeholder="Причина визита, номер накладной или ФИО приглашающего..." />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white">Отмена</button>
            <button type="submit" disabled={loading} className="px-12 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all rounded-2xl disabled:opacity-50">
              {loading ? 'Запись...' : 'Сохранить допуск'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleModal;
