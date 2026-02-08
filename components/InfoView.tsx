
import React, { useState, useEffect, useMemo } from 'react';
import { InfoArticle, User, StaffDirectory, PhoneRecord } from '../types';
import { storage } from '../services/storage';
import { PlusIcon, TrashIcon, EditIcon, BookIcon, UsersIcon, PrinterIcon } from './Icons';

interface InfoViewProps {
  currentUser: User;
}

const CATEGORY_LABELS: Record<InfoArticle['category'], { label: string; color: string; bg: string }> = {
  instruction: { label: 'Инструкция', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  regulation: { label: 'Регламент', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  contact: { label: 'Контакты', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  note: { label: 'Заметка', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
};

const InfoView: React.FC<InfoViewProps> = ({ currentUser }) => {
  const [articles, setArticles] = useState<InfoArticle[]>([]);
  const [directory, setDirectory] = useState<StaffDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'directory'>('articles');
  
  // Articles states
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [searchArticles, setSearchArticles] = useState('');
  const [filterCategory, setFilterCategory] = useState<InfoArticle['category'] | 'all'>('all');
  const [editingArticle, setEditingArticle] = useState<Partial<InfoArticle> | null>(null);
  const [viewingArticle, setViewingArticle] = useState<InfoArticle | null>(null);

  // Directory states
  const [searchDir, setSearchDir] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PhoneRecord; direction: 'asc' | 'desc' } | null>(null);

  const isAdmin = currentUser.roles.includes('admin');
  const canManage = isAdmin || currentUser.roles.includes('info') || currentUser.roles.includes('it_admin');

  const loadData = async () => {
    setLoading(true);
    const [articlesData, dirData] = await Promise.all([
      storage.getInfoArticles(),
      storage.getStaffDirectory()
    ]);
    setArticles(articlesData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    setDirectory(dirData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (filterCategory !== 'all') {
      result = result.filter(a => a.category === filterCategory);
    }
    if (searchArticles) {
      const q = searchArticles.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, filterCategory, searchArticles]);

  const requestSort = (key: keyof PhoneRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredRecords = useMemo(() => {
    if (!directory || !directory.phoneRecords) return [];
    let result = [...directory.phoneRecords];
    
    if (filterDept !== 'all') {
      result = result.filter(r => r.department === filterDept);
    }
    if (searchDir) {
      const q = searchDir.toLowerCase();
      result = result.filter(r => 
        r.label.toLowerCase().includes(q) || 
        r.number.includes(q) ||
        r.cabinet.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aVal = (a[sortConfig.key] || '').toString();
        const bVal = (b[sortConfig.key] || '').toString();
        const comparison = aVal.localeCompare(bVal, 'ru', { numeric: true, sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else {
      result.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    }

    return result;
  }, [directory, filterDept, searchDir, sortConfig]);

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    const article: InfoArticle = {
      id: editingArticle.id || crypto.randomUUID(),
      title: editingArticle.title || 'Без названия',
      content: editingArticle.content || '',
      category: editingArticle.category || 'note',
      authorId: editingArticle.authorId || currentUser.id,
      authorName: editingArticle.authorName || currentUser.username,
      isPublic: editingArticle.isPublic || false,
      createdAt: editingArticle.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedList;
    if (editingArticle.id) {
      updatedList = articles.map(a => a.id === article.id ? article : a);
    } else {
      updatedList = [article, ...articles];
    }

    setArticles(updatedList);
    await storage.saveInfoArticles(updatedList);
    setIsArticleModalOpen(false);
    setEditingArticle(null);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Удалить статью из базы знаний?')) return;
    const updated = articles.filter(a => a.id !== id);
    setArticles(updated);
    await storage.saveInfoArticles(updated);
  };

  const SortIndicator = ({ column }: { column: keyof PhoneRecord }) => {
    if (!sortConfig || sortConfig.key !== column) return <span className="ml-1 opacity-20 text-[8px]">↕</span>;
    return (
      <span className="ml-1 text-amber-500 text-[10px]">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-full transition-colors duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/20 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
            <BookIcon className="w-8 h-8 text-amber-600 dark:text-amber-500" /> ИНФОРМАЦИЯ
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <button 
                onClick={() => setActiveSubTab('articles')}
                className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeSubTab === 'articles' ? 'border-amber-600 text-amber-600 dark:text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
            >
                База знаний
            </button>
            <button 
                onClick={() => setActiveSubTab('directory')}
                className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeSubTab === 'directory' ? 'border-amber-600 text-amber-600 dark:text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
            >
                Телефонный справочник
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          {activeSubTab === 'articles' && canManage && (
            <button 
              onClick={() => { setEditingArticle({ title: '', content: '', category: 'note', isPublic: false }); setIsArticleModalOpen(true); }} 
              className="bg-amber-600 text-white px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 dark:shadow-none"
            >
              <PlusIcon className="w-5 h-5" /> Создать статью
            </button>
          )}
          {activeSubTab === 'directory' && (
            <button 
              onClick={() => window.print()} 
              className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all"
            >
              <PrinterIcon className="w-5 h-5" /> Печать справочника
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'articles' ? (
        <>
          <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 sticky top-0 z-20 no-print transition-colors">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
              <button 
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${filterCategory === 'all' ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                Все
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                <button 
                  key={key}
                  onClick={() => setFilterCategory(key as any)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${filterCategory === key ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input 
              type="text" 
              placeholder="Поиск по базе знаний..." 
              value={searchArticles}
              onChange={e => setSearchArticles(e.target.value)}
              className="w-full md:flex-1 px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white font-bold text-sm"
            />
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-20 font-black text-slate-200 dark:text-slate-800 animate-pulse uppercase tracking-widest">Загрузка...</div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-slate-100 dark:border-slate-800">
                <BookIcon className="w-16 h-16 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.2em] text-xs">Статьи не найдены</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map(article => (
                  <div 
                    key={article.id} 
                    className={`border p-6 flex flex-col gap-4 relative group hover:shadow-xl dark:hover:bg-slate-800/40 transition-all bg-white dark:bg-slate-800/30 cursor-pointer ${article.isPublic ? 'border-indigo-100 dark:border-indigo-900/50' : 'border-slate-100 dark:border-slate-800'}`}
                    onClick={() => setViewingArticle(article)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-tighter border ${CATEGORY_LABELS[article.category].color} ${CATEGORY_LABELS[article.category].bg} border-current`}>
                          {CATEGORY_LABELS[article.category].label}
                        </span>
                        {article.isPublic && (
                          <span className="flex items-center gap-1 text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-1 py-1 border border-indigo-100 dark:border-indigo-800" title="Видна на экране входа">
                            Public
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="min-h-[60px]">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight line-clamp-2">{article.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed whitespace-pre-wrap italic">{article.content}</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">{article.authorName[0]}</div>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">{article.authorName}</span>
                      </div>
                      {canManage && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setEditingArticle(article); setIsArticleModalOpen(true); }} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"><EditIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteArticle(article.id)} className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-8">
          <div className="mb-6 flex flex-col md:flex-row gap-4 no-print">
            <input 
              type="text" 
              placeholder="Поиск по названию, телефону или кабинету..." 
              value={searchDir}
              onChange={e => setSearchDir(e.target.value)}
              className="w-full md:flex-1 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-600 dark:text-white font-bold text-sm uppercase tracking-tight"
            />
            <select 
              value={filterDept} 
              onChange={e => setFilterDept(e.target.value)}
              className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest outline-none focus:border-amber-600 dark:text-slate-300"
            >
              <option value="all">Все отделы</option>
              {directory?.departments.map(d => <option key={d} value={d} className="bg-white dark:bg-slate-800">{d}</option>)}
            </select>
          </div>

          <div className="print:block overflow-x-auto">
            <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-4">
              <h1 className="text-2xl font-black uppercase tracking-tight">Телефонный справочник СДДТ</h1>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">Актуально на {new Date().toLocaleDateString('ru-RU')}</p>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white border-b-2 border-slate-900 dark:border-slate-800">
                  <th className="px-6 py-4">
                    <button 
                      onClick={() => requestSort('label')} 
                      className="text-[10px] font-black uppercase tracking-wider flex items-center hover:text-amber-500 transition-colors"
                    >
                      Наименование / <SortIndicator column="label" />
                    </button>
                    <button 
                      onClick={() => requestSort('department')} 
                      className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter hover:text-white mt-0.5 block"
                    >
                      Отдел <SortIndicator column="department" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button 
                      onClick={() => requestSort('cabinet')} 
                      className="text-[10px] font-black uppercase tracking-wider flex items-center justify-center mx-auto hover:text-amber-500 transition-colors"
                    >
                      Кабинет <SortIndicator column="cabinet" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button 
                      onClick={() => requestSort('number')} 
                      className="text-[10px] font-black uppercase tracking-wider flex items-center justify-end ml-auto hover:text-amber-500 transition-colors"
                    >
                      Телефон <SortIndicator column="number" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider hidden md:table-cell">Примечание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length > 0 ? filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{record.label}</div>
                      <div className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tighter">{record.department || 'Общий'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-slate-300 uppercase">{record.cabinet || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record.number ? (
                        <a href={`tel:${record.number}`} className="text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors tabular-nums">
                          {record.number}
                        </a>
                      ) : <span className="text-slate-200 dark:text-slate-800">—</span>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic truncate max-w-[200px]">{record.notes || '—'}</div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase text-xs tracking-widest italic">
                      Записи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Article Modal (Create/Edit) */}
      {isArticleModalOpen && editingArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slide-in">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingArticle.id ? 'Редактирование статьи' : 'Новая статья базы знаний'}
                </h2>
                <button onClick={() => { setIsArticleModalOpen(false); setEditingArticle(null); }} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2">
                    <PlusIcon className="w-8 h-8 rotate-45" />
                </button>
             </div>
             <form onSubmit={handleSaveArticle} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Категория</label>
                        <select 
                            required 
                            value={editingArticle.category} 
                            onChange={e => setEditingArticle({...editingArticle, category: e.target.value as any})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-600"
                        >
                            {Object.entries(CATEGORY_LABELS).map(([val, {label}]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={editingArticle.isPublic} 
                                onChange={e => setEditingArticle({...editingArticle, isPublic: e.target.checked})}
                                className="w-5 h-5 accent-indigo-600"
                            />
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Публичный доступ</span>
                        </label>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Заголовок</label>
                    <input 
                        required 
                        value={editingArticle.title} 
                        onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sm uppercase text-slate-900 dark:text-white outline-none focus:border-amber-600" 
                        placeholder="Краткое название статьи..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Содержание</label>
                    <textarea 
                        required 
                        rows={10}
                        value={editingArticle.content} 
                        onChange={e => setEditingArticle({...editingArticle, content: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-900 dark:text-white outline-none focus:border-amber-600 resize-none font-medium whitespace-pre-wrap" 
                        placeholder="Текст инструкции или регламента..."
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                    <button type="button" onClick={() => { setIsArticleModalOpen(false); setEditingArticle(null); }} className="px-8 py-3 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">Отмена</button>
                    <button type="submit" className="bg-amber-600 text-white px-12 py-3 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-100 dark:shadow-none hover:bg-amber-700">Опубликовать</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Article Reader (Viewer) */}
      {viewingArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 dark:bg-black/95 backdrop-blur-md" onClick={() => setViewingArticle(null)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-slide-in" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest border ${CATEGORY_LABELS[viewingArticle.category].color} ${CATEGORY_LABELS[viewingArticle.category].bg} border-current`}>
                                {CATEGORY_LABELS[viewingArticle.category].label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(viewingArticle.updatedAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{viewingArticle.title}</h2>
                    </div>
                    <button onClick={() => setViewingArticle(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 border border-slate-100 dark:border-slate-800 rounded-full">
                        <PlusIcon className="w-8 h-8 rotate-45" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                            {viewingArticle.content}
                        </p>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center font-black text-xs text-amber-600">
                            {viewingArticle.authorName[0]}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Автор материала</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{viewingArticle.authorName}</p>
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-colors">Распечатать</button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default InfoView;
