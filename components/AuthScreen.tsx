
import React, { useState, useMemo, useEffect } from 'react';
import { User, InfoArticle, StaffDirectory } from '../types';
import { storage } from '../services/storage';
import { PulseIcon, BookIcon } from './Icons';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  publicArticles: InfoArticle[];
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  instruction: { label: 'Инструкция', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  regulation: { label: 'Регламент', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  contact: { label: 'Контакты', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  note: { label: 'Заметка', color: 'text-amber-400', bg: 'bg-amber-500/10' }
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, publicArticles, isLoading }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Register state
  const [regData, setRegData] = useState({ fio: '', password: '', department: '', birthday: '' });
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);

  useEffect(() => {
    storage.getStaffDirectory().then(setDirectory);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const users = await storage.getUserRegistry();
      const user = users.find(u => 
        u.login.toLowerCase() === loginInput.toLowerCase().trim() && 
        u.password === passwordInput
      );
      
      if (user) {
        // Учетная запись admin всегда считается активной для предотвращения lockout
        if (!user.isActive && user.login.toLowerCase() !== 'admin') {
          setError('Ваш аккаунт ожидает активации администратором');
        } else {
          storage.saveAuth(user);
          onLogin(user);
        }
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (err: any) {
      setError('Ошибка подключения. Проверьте интернет.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.fio || !regData.password || !regData.department || !regData.birthday) {
      return setError('Пожалуйста, заполните все поля');
    }
    setLoading(true);
    setError('');

    try {
      const users = await storage.getUserRegistry();
      if (users.find(u => u.login.toLowerCase() === regData.fio.toLowerCase().trim())) {
        setError('Пользователь с таким ФИО уже зарегистрирован');
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        login: regData.fio.trim(),
        username: regData.fio.trim(),
        password: regData.password,
        department: regData.department,
        birthday: regData.birthday,
        // Fix: Changed roles from ['viewer'] to [] because 'viewer' is not a valid UserRole.
        // In this RBAC system, users with no specific roles still have access to the dashboard.
        roles: [], 
        isActive: false, 
        createdAt: new Date().toISOString()
      };

      await storage.saveUserRegistry([...users, newUser]);
      setSuccess('Заявка на регистрацию отправлена! Пожалуйста, дождитесь активации аккаунта администратором.');
      setMode('login');
      setLoginInput(regData.fio);
      setRegData({ fio: '', password: '', department: '', birthday: '' });
    } catch (err) {
      setError('Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const sortedArticles = useMemo(() => {
    return [...publicArticles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [publicArticles]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] bg-cover bg-center relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full lg:w-2/5 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl mb-6">
              <PulseIcon className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter leading-tight uppercase">Пульс Дворца</h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mt-4 opacity-60">Digital Control Core</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-md">
            {error && <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium text-center animate-slide-in">{error}</div>}
            {success && <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium text-center animate-slide-in">{success}</div>}
            
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Логин (ФИО)</label>
                    <input required disabled={loading} value={loginInput} onChange={e => setLoginInput(e.target.value)} className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded-none transition-all font-bold" placeholder="Введите логин" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Пароль</label>
                    <input required disabled={loading} type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-white/5 border border-white/10 px-5 py-4 text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded-none transition-all" placeholder="••••••••" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/40 uppercase text-xs tracking-widest">
                  {loading ? 'Вход...' : 'Войти в систему'}
                </button>

                <div className="pt-4 text-center">
                  <button type="button" onClick={() => { setMode('register'); setSuccess(''); setError(''); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    Нет аккаунта? Зарегистрироваться
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Ваше ФИО</label>
                   <input required value={regData.fio} onChange={e => setRegData({...regData, fio: e.target.value})} className="w-full bg-white/5 border border-white/10 px-5 py-3 text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded-none font-bold" placeholder="Иванов Иван Иванович" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Придумайте пароль</label>
                   <input required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 px-5 py-3 text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded-none" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Отдел</label>
                        <select required value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded-none font-bold text-xs appearance-none">
                            <option value="" className="bg-slate-800">Выбрать...</option>
                            {directory?.departments.map(d => <option key={d} value={d} className="bg-slate-800">{d}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">День рождения</label>
                        <input required type="date" value={regData.birthday} onChange={e => setRegData({...regData, birthday: e.target.value})} className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded-none text-xs" />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 mt-4 transition-all disabled:opacity-50 uppercase text-xs tracking-widest">
                  {loading ? 'Обработка...' : 'Отправить заявку'}
                </button>

                <div className="pt-2 text-center">
                  <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    Уже есть аккаунт? Войти
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full lg:w-3/5 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col p-8 md:p-16 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl w-full mx-auto">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Общая информация</h2>
                <p className="text-indigo-400 text-[10px] uppercase font-black tracking-widest mt-1">Публичные материалы и инструкции</p>
             </div>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Загрузка...</span>
              </div>
            ) : sortedArticles.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 p-12">
                <BookIcon className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Нет доступных материалов</p>
              </div>
            ) : (
              sortedArticles.map((article) => (
                <div key={article.id} className="p-8 bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-current ${CATEGORY_LABELS[article.category].color} ${CATEGORY_LABELS[article.category].bg}`}>
                      {CATEGORY_LABELS[article.category].label}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3 group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-4 whitespace-pre-wrap italic">
                    {article.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
