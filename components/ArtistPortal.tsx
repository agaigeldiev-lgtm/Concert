
import React, { useState, useEffect } from 'react';
import { GuestGuide } from '../types';
import { storage } from '../services/storage';
import { PulseIcon } from './Icons';

const ArtistPortal: React.FC<{ guideId: string }> = ({ guideId }) => {
  const [guide, setGuide] = useState<GuestGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    storage.getGuestGuides().then(all => {
      const found = all.find(g => g.id === guideId);
      setGuide(found || null);
      setLoading(false);
    });
  }, [guideId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} скопирован в буфер обмена!`);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
       <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-4"></div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em]">Загрузка путеводителя...</p>
    </div>
  );

  if (!guide || !guide.isActive) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
       <div className="w-20 h-20 bg-rose-500/20 text-rose-500 flex items-center justify-center rounded-full mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
       </div>
       <h1 className="text-2xl font-black uppercase mb-2 text-slate-200">Путеводитель не активен</h1>
       <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Срок действия ссылки истек или она неверна</p>
    </div>
  );

  const dressingRoomsArray = guide.dressingRooms ? guide.dressingRooms.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500 pb-20 overflow-x-hidden">
      {/* Шапка / Приветствие */}
      <div className="relative h-[60vh] bg-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80')] bg-cover bg-center scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        
        <div className="relative z-10 text-center space-y-6 max-w-2xl">
          <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/50 rounded-xl transform -rotate-3">
             <PulseIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-4">{guide.title}</h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
               <p className="text-indigo-400 font-black uppercase text-[9px] tracking-[0.2em]">Гид по мероприятию</p>
            </div>
          </div>
          
          {guide.welcomeText && (
            <p className="text-slate-300 text-lg italic font-medium leading-relaxed px-6 opacity-90">
              "{guide.welcomeText}"
            </p>
          )}

          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                Площадка: <span className="text-white">{guide.venue}</span>
            </div>
            {guide.yandexMapsUrl && (
                <a href={guide.yandexMapsUrl} target="_blank" className="bg-white text-slate-950 px-10 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-indigo-500 hover:text-white shadow-2xl active:scale-95">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/></svg>
                    Открыть в картах
                </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-20 space-y-10">
        
        {/* Важные напоминания */}
        {(guide.showParkingReminder || guide.showRiderReminder) && (
            <div className="bg-rose-600 p-1">
                <div className="bg-slate-950 p-6 space-y-4 border border-rose-600/20">
                    <div className="flex items-center gap-3 text-rose-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <h3 className="text-sm font-black uppercase tracking-widest">Важная информация</h3>
                    </div>
                    <ul className="space-y-4">
                        {guide.showParkingReminder && (
                            <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0"></span>
                                Списки автомобилей на парковку: необходимо прислать за 24 часа до заезда.
                            </li>
                        )}
                        {guide.showRiderReminder && (
                            <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0"></span>
                                Технический райдер: пожалуйста, подтвердите финальную конфигурацию.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        )}

        {/* РАЗДЕЛ: ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ */}
        <section className="space-y-4">
           <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-amber-500/30 flex-1"></div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-amber-500 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                 Технический отдел
              </h2>
              <div className="h-px bg-amber-500/30 flex-1"></div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {guide.venueTechSpecs && (
                <div className="bg-slate-900 border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 bg-amber-600/10 text-amber-500 text-[8px] font-black uppercase tracking-widest">Спецификация</div>
                    <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest">Оснащение зала</h3>
                    <div className="text-xs text-slate-300 leading-loose whitespace-pre-wrap font-mono bg-black/40 p-5 border border-white/5">
                        {guide.venueTechSpecs}
                    </div>
                </div>
              )}

              {guide.stagePlanUrl && (
                <button onClick={() => setActivePhoto(guide.stagePlanUrl)} className="relative h-48 bg-slate-900 border border-white/10 group overflow-hidden w-full text-left">
                    <img src={guide.stagePlanUrl} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-500 group-hover:scale-110" alt="Сцена" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Схема сцены</span>
                        <h4 className="text-lg font-black uppercase">Просмотр плана сцены</h4>
                    </div>
                    <div className="absolute top-6 right-6">
                        <svg className="w-6 h-6 text-white/50 group-hover:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                    </div>
                </button>
              )}

              <a href={`tel:${guide.techContactPhone}`} className="bg-slate-900 border border-amber-600/30 p-6 flex items-center justify-between hover:bg-amber-600/10 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-600/20 text-amber-500 rounded-lg group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
                    <div>
                        <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-1">Дежурный инженер</p>
                        <h4 className="text-base font-black uppercase text-slate-200 group-hover:text-white">{guide.techContactName || 'Техническая служба'}</h4>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Позвонить</p>
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                </div>
              </a>
           </div>
        </section>

        {/* РАЗДЕЛ: БЫТОВАЯ ИНФОРМАЦИЯ */}
        <section className="space-y-4">
           <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-indigo-500/30 flex-1"></div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                 Бытовые условия
              </h2>
              <div className="h-px bg-indigo-500/30 flex-1"></div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {/* Гримерки */}
              {dressingRoomsArray.length > 0 && (
                <div className="bg-slate-900 border border-white/10 p-6 space-y-4 shadow-2xl">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Назначенные гримерные</h3>
                    <div className="flex flex-wrap gap-3">
                        {dressingRoomsArray.map(room => (
                            <div key={room} className="flex-1 min-w-[120px] p-4 bg-indigo-600/10 border border-indigo-600/30 flex flex-col items-center justify-center gap-2 rounded-xl group hover:bg-indigo-600 hover:scale-105 transition-all cursor-default">
                                <svg className="w-5 h-5 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                <span className="text-xs font-black uppercase group-hover:text-white">№ {room}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* Wi-Fi */}
              <div className="bg-slate-900 border border-white/10 p-6 space-y-4 shadow-2xl group">
                <div className="flex justify-between items-start">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Интернет для гостей</h3>
                    <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-full group-hover:animate-pulse"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.345 6.347c5.273-5.273 13.821-5.273 19.094 0"/></svg></div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Имя сети (SSID)</span>
                        <span className="text-sm font-mono font-black text-white">{guide.wifiSsid}</span>
                    </div>
                    <button 
                        onClick={() => copyToClipboard(guide.wifiPass, 'Пароль')}
                        className="flex justify-between items-center w-full py-2 group/btn"
                    >
                        <span className="text-[10px] text-slate-500 uppercase font-black">Пароль</span>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-mono font-black text-indigo-400 group-hover/btn:text-white transition-colors">{guide.wifiPass || 'Без пароля'}</span>
                           <svg className="w-4 h-4 text-slate-600 group-hover/btn:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                        </div>
                    </button>
                </div>
              </div>

              {/* Питание и быт */}
              {guide.cateringInfo && (
                <div className="bg-slate-900 border border-white/10 p-6 space-y-4 shadow-2xl relative">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Питание и дополнительные услуги</h3>
                    <div className="text-sm text-slate-300 italic leading-relaxed whitespace-pre-wrap font-medium p-4 bg-indigo-600/5 border-l-2 border-indigo-500">
                        {guide.cateringInfo}
                    </div>
                </div>
              )}
           </div>
        </section>

        {/* ЛОГИСТИКА И БЕЗОПАСНОСТЬ */}
        <section className="space-y-4">
           <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-slate-800 flex-1"></div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                 Логистика и охрана
              </h2>
              <div className="h-px bg-slate-800 flex-1"></div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {guide.loadingInfo && (
                <div className="p-6 bg-slate-900 border border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Инструкция по заезду и разгрузке</h4>
                    <p className="text-sm text-slate-300 italic leading-relaxed whitespace-pre-wrap font-medium">{guide.loadingInfo}</p>
                </div>
              )}

              {guide.entrancePhotoUrl && (
                <button onClick={() => setActivePhoto(guide.entrancePhotoUrl)} className="relative h-40 bg-slate-900 border border-white/10 group overflow-hidden">
                    <img src={guide.entrancePhotoUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Служебный вход" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest">Просмотр фото входа</div>
                    </div>
                </button>
              )}

              <a href={`tel:${guide.securityContactPhone}`} className="bg-slate-900 border border-white/10 p-6 flex items-center justify-between hover:bg-rose-600/10 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-600/20 text-rose-400 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
                    <div>
                        <p className="text-[10px] text-rose-500 uppercase font-black tracking-widest mb-1">Служба безопасности</p>
                        <h4 className="text-sm font-black uppercase text-slate-200 group-hover:text-white">{guide.securityContactName || 'Контроль доступа'}</h4>
                    </div>
                </div>
                <svg className="w-5 h-5 text-slate-700 group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              </a>
           </div>
        </section>

        <div className="pt-20 text-center border-t border-white/5">
           <p className="text-[9px] font-black uppercase text-slate-700 tracking-[0.6em] mb-4">Официальный портал для артистов</p>
           <div className="flex items-center justify-center gap-2 text-indigo-600/40">
              <PulseIcon className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-widest">Ставропольский Дворец — Цифровое ядро</span>
           </div>
        </div>
      </div>

      {/* Модальное окно просмотра фото */}
      {activePhoto && (
          <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setActivePhoto(null)}>
              <div className="relative max-w-5xl w-full h-[80vh] flex items-center justify-center">
                <img src={activePhoto} className="max-w-full max-h-full object-contain shadow-2xl border border-white/10" alt="Полноэкранный просмотр" />
                <button onClick={() => setActivePhoto(null)} className="absolute -top-12 right-0 p-4 text-white hover:text-indigo-400 transition-colors">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Нажмите в любом месте, чтобы закрыть</p>
          </div>
      )}
    </div>
  );
};

export default ArtistPortal;
