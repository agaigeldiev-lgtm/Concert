
import React, { useState, useEffect } from 'react';
import { StaffRole, StaffDirectory, Employee } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, TrashIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'venues'>('staff');

  useEffect(() => {
    if (isOpen) {
      const dir = storage.getStaffDirectory();
      setEmployees(dir.employees);
      setVenues(dir.venues || []);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddEmployee = () => {
    if (!newName.trim()) return;
    const newEmp: Employee = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      roles: []
    };
    setEmployees([...employees, newEmp]);
    setNewName('');
  };

  const handleAddVenue = () => {
    if (!newVenue.trim()) return;
    if (venues.includes(newVenue.trim())) return;
    setVenues([...venues, newVenue.trim()]);
    setNewVenue('');
  };

  const handleRemoveVenue = (venueToRemove: string) => {
    if (confirm(`Удалить площадку "${venueToRemove}" из списка?`)) {
      setVenues(venues.filter(v => v !== venueToRemove));
    }
  };

  const handleToggleRole = (empId: string, role: StaffRole) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;
      const roles = emp.roles.includes(role)
        ? emp.roles.filter(r => r !== role)
        : [...emp.roles, role];
      return { ...emp, roles };
    }));
  };

  const handleRemoveEmployee = (id: string) => {
    if (confirm('Удалить этого сотрудника из базы?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleSave = () => {
    storage.saveStaffDirectory({ employees, venues });
    onSave();
    onClose();
  };

  const manageableRoles = Object.values(StaffRole).filter(role => role !== StaffRole.DUTY);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Настройки системы</h2>
            <p className="text-xs text-slate-500">Управление базой сотрудников и списком площадок</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'staff' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Сотрудники
          </button>
          <button 
            onClick={() => setActiveTab('venues')}
            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'venues' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Площадки
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'staff' ? (
            <div className="space-y-6">
              {/* Add Employee Form */}
              <div className="flex gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">ФИО нового сотрудника</label>
                  <input
                    type="text"
                    placeholder="Напр., Кузнецов Николай"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmployee()}
                    className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleAddEmployee}
                  className="mt-5 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-semibold shadow-md shadow-indigo-200 active:scale-95"
                >
                  <PlusIcon className="w-5 h-5" />
                  Добавить
                </button>
              </div>

              {/* Employees List */}
              <div className="space-y-3">
                {employees.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic">Сотрудники не добавлены</div>
                ) : (
                  employees.sort((a,b) => a.name.localeCompare(b.name)).map((emp) => (
                    <div key={emp.id} className="p-4 bg-white border rounded-xl hover:border-indigo-300 transition-colors flex flex-col md:flex-row md:items-center gap-4 group">
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Доступные роли: {emp.roles.length || 'нет'}</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 flex-[2]">
                        {manageableRoles.map(role => {
                          const isActive = emp.roles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => handleToggleRole(emp.id, role)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                                isActive 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-500'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>

                      <button 
                        onClick={() => handleRemoveEmployee(emp.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Venue Form */}
              <div className="flex gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Название новой площадки</label>
                  <input
                    type="text"
                    placeholder="Напр., Stadium Live"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVenue()}
                    className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleAddVenue}
                  className="mt-5 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-semibold shadow-md shadow-emerald-200 active:scale-95"
                >
                  <PlusIcon className="w-5 h-5" />
                  Добавить
                </button>
              </div>

              {/* Venues List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {venues.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 italic">Список площадок пуст</div>
                ) : (
                  venues.sort().map((venue) => (
                    <div key={venue} className="flex items-center justify-between p-4 bg-white border rounded-xl group hover:border-emerald-300 transition-colors">
                      <span className="font-semibold text-slate-700">{venue}</span>
                      <button 
                        onClick={() => handleRemoveVenue(venue)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center bg-slate-50 rounded-b-2xl">
          <div className="text-[10px] text-slate-500 max-w-sm leading-tight italic">
            {activeTab === 'staff' 
              ? "Отметьте специальности для каждого сотрудника. Дежурным может быть назначен звукорежиссер, художник по свету или электрик."
              : "Список площадок используется для быстрого выбора в карточке мероприятия. Первый в списке будет выбран по умолчанию."}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 border rounded-xl hover:bg-white transition-colors">Отмена</button>
            <button 
              onClick={handleSave}
              className="px-8 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold"
            >
              Применить изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
