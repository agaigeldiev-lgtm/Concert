
import React, { useState, useEffect } from 'react';
import { ConcertEvent, StaffRole, StaffAssignment, StaffDirectory } from '../types';
import { storage } from '../services/storage';
import { PrinterIcon } from './Icons';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  eventToEdit: ConcertEvent | null;
  initialDate?: Date;
}

const defaultStaff: StaffAssignment = {
  [StaffRole.ADMIN]: '',
  [StaffRole.SECURITY]: '',
  [StaffRole.SOUND]: '',
  [StaffRole.LIGHT]: '',
  [StaffRole.VIDEO]: '',
  [StaffRole.ELECTRIC]: '',
  [StaffRole.DUTY]: ''
};

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, eventToEdit, initialDate }) => {
  const [settings, setSettings] = useState<StaffDirectory>(storage.getStaffDirectory());
  const [formData, setFormData] = useState<Omit<ConcertEvent, 'id'>>({
    title: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    arrivalTime: '14:00',
    soundcheckTime: '16:00',
    doorsTime: '19:00',
    startTime: '20:00',
    venue: '',
    notes: '',
    rider: '',
    isPaid: true,
    staff: { ...defaultStaff }
  });

  useEffect(() => {
    if (isOpen) {
      const currentSettings = storage.getStaffDirectory();
      setSettings(currentSettings);

      if (eventToEdit) {
        setFormData({
          title: eventToEdit.title,
          date: eventToEdit.date,
          arrivalTime: eventToEdit.arrivalTime,
          soundcheckTime: eventToEdit.soundcheckTime, 
          doorsTime: eventToEdit.doorsTime,
          startTime: eventToEdit.startTime,
          venue: eventToEdit.venue,
          notes: eventToEdit.notes,
          rider: eventToEdit.rider || '',
          isPaid: eventToEdit.isPaid ?? true,
          staff: { ...eventToEdit.staff }
        });
      } else {
        const defaultVenue = (currentSettings.venues && currentSettings.venues.length > 0) 
          ? currentSettings.venues[0] 
          : '';
          
        setFormData({
          title: '',
          date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          arrivalTime: '14:00',
          soundcheckTime: '16:00',
          doorsTime: '19:00',
          startTime: '20:00',
          venue: defaultVenue,
          notes: '',
          rider: '',
          isPaid: true,
          staff: { ...defaultStaff }
        });
      }
    }
  }, [eventToEdit, initialDate, isOpen]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const staffGridHtml = (Object.entries(formData.staff) as [string, string][])
      .map(([role, name]) => `
        <div style="display: flex; border-bottom: 1px solid #f1f5f9; padding: 4px 0; font-size: 11px;">
          <div style="width: 100px; font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 9px;">${role}</div>
          <div style="flex: 1; color: #1e293b;">${name || '—'}</div>
        </div>
      `).join('');

    const formattedDate = new Date(formData.date).toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Карточка мероприятия - ${formData.title}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #1e293b; line-height: 1.4; -webkit-print-color-adjust: exact; }
            .container { max-width: 100%; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 15px; }
            .brand { color: #4f46e5; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
            .event-title { font-size: 22px; font-weight: 800; margin: 2px 0; }
            .event-meta { font-size: 13px; color: #64748b; font-weight: 500; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; margin-left: 10px; }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-free { background: #fee2e2; color: #991b1b; }

            .top-grid { display: grid; grid-template-cols: 1fr 1.5fr; gap: 20px; margin-bottom: 15px; }
            
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 8px; }
            
            .timing-table { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .timing-item { background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #f1f5f9; text-align: center; }
            .timing-label { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
            .timing-value { font-size: 16px; font-weight: 700; color: #1e293b; }
            .timing-item.highlight { background: #eef2ff; border-color: #c7d2fe; }
            .timing-item.highlight .timing-value { color: #4f46e5; }

            .staff-list { display: flex; flex-direction: column; }
            
            .text-section { margin-top: 15px; }
            .text-box { background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; font-size: 12px; white-space: pre-wrap; min-height: 40px; }
            
            .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #94a3b8; padding: 10px 0; border-top: 1px solid #f1f5f9; }
            .no-break { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <p class="brand">Концерты / Стейдж-карта</p>
                <h1 class="event-title">
                  ${formData.title}
                  <span class="badge ${formData.isPaid ? 'badge-paid' : 'badge-free'}">
                    ${formData.isPaid ? 'Платное' : 'Бюджетное'}
                  </span>
                </h1>
                <div class="event-meta">${formattedDate} • <strong>${formData.venue}</strong></div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 10px; color: #94a3b8;">Создано: ${new Date().toLocaleDateString('ru-RU')}</div>
                <div style="font-size: 12px; font-weight: 800; margin-top: 5px;">ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
              </div>
            </div>

            <div class="top-grid">
              <div class="no-break">
                <div class="section-title">Тайминг</div>
                <div class="timing-table">
                  <div class="timing-item">
                    <div class="timing-label">Заезд</div>
                    <div class="timing-value">${formData.arrivalTime}</div>
                  </div>
                  <div class="timing-item">
                    <div class="timing-label">Чек</div>
                    <div class="timing-value">${formData.soundcheckTime}</div>
                  </div>
                  <div class="timing-item">
                    <div class="timing-label">Двери</div>
                    <div class="timing-value">${formData.doorsTime}</div>
                  </div>
                  <div class="timing-item highlight">
                    <div class="timing-label">Шоу</div>
                    <div class="timing-value">${formData.startTime}</div>
                  </div>
                </div>
              </div>
              
              <div class="no-break">
                <div class="section-title">Команда</div>
                <div class="staff-list">
                  ${staffGridHtml}
                </div>
              </div>
            </div>

            <div class="text-section no-break">
              <div class="section-title">Примечания к заезду</div>
              <div class="text-box">${formData.notes || 'Нет дополнительных примечаний'}</div>
            </div>

            <div class="text-section no-break">
              <div class="section-title">Технический Райдер / Бэклайн</div>
              <div class="text-box" style="min-height: 150px;">${formData.rider || 'Райдер не заполнен'}</div>
            </div>

            <div class="footer">
              Концерты — Профессиональный контроль мероприятий. Данная карта предназначена для внутреннего использования техническими службами площадки.
            </div>
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventToEdit) {
      storage.updateEvent({ ...formData, id: eventToEdit.id } as ConcertEvent);
    } else {
      storage.addEvent({ ...formData, id: crypto.randomUUID() } as ConcertEvent);
    }
    onSave();
    onClose();
  };

  const handleStaffChange = (role: StaffRole, name: string) => {
    setFormData(prev => ({
      ...prev,
      staff: { ...prev.staff, [role]: name }
    }));
  };

  const getOptionsForRole = (role: StaffRole) => {
    const allEmployees = settings.employees || [];
    
    if (role === StaffRole.DUTY) {
      return allEmployees
        .filter(emp => 
          emp.roles.includes(StaffRole.SOUND) || 
          emp.roles.includes(StaffRole.LIGHT) || 
          emp.roles.includes(StaffRole.ELECTRIC)
        )
        .map(emp => emp.name)
        .sort();
    }
    
    return allEmployees
      .filter(emp => emp.roles.includes(role))
      .map(emp => emp.name)
      .sort();
  };

  const manageableRoles = Object.values(StaffRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800">
                {eventToEdit ? 'Редактировать мероприятие' : 'Новое мероприятие'}
              </h2>
              {eventToEdit && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-sm font-bold transition-all"
                  title="Печать карточки мероприятия"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Печать PDF (A4)
                </button>
              )}
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b pb-2 flex justify-between items-center">
                <span>Основная информация</span>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPaid: true })}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.isPaid ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    Платное
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPaid: false })}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!formData.isPaid ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    Бесплатное
                  </button>
                </div>
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название мероприятия</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Напр., Концерт Группы А"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Место проведения</label>
                {settings.venues && settings.venues.length > 0 ? (
                  <select
                    required
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
                  >
                    <option value="" disabled>Выберите площадку</option>
                    {settings.venues.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                    Площадки не настроены. Добавьте их в <strong>Настройках</strong>.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Заезд (Load-in)</label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Саундчек</label>
                  <input
                    type="time"
                    value={formData.soundcheckTime}
                    onChange={e => setFormData({ ...formData, soundcheckTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Двери (Doors)</label>
                  <input
                    type="time"
                    value={formData.doorsTime}
                    onChange={e => setFormData({ ...formData, doorsTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Старт Шоу</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b pb-2">Назначение персонала</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {manageableRoles.map(role => {
                  const options = getOptionsForRole(role);
                  return (
                    <div key={role} className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                        {role}
                        {role === StaffRole.DUTY && <span className="text-[9px] text-indigo-400 font-normal normal-case ml-1">(тех. персонал)</span>}
                      </label>
                      <select
                        value={formData.staff[role]}
                        onChange={e => handleStaffChange(role, e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] ${
                          role === StaffRole.DUTY ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white'
                        }`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
                      >
                        <option value="">Не назначено</option>
                        {options.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      {options.length === 0 && <span className="text-[9px] text-amber-500 mt-0.5">Нет подходящих сотрудников</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Примечания</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] text-sm"
                placeholder="Дополнительная информация о заезде..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Райдер</label>
              <textarea
                value={formData.rider}
                onChange={e => setFormData({ ...formData, rider: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] text-sm"
                placeholder="Технические требования, список оборудования..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-xl hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-8 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 font-bold"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
