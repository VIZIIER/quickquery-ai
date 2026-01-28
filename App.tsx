
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SearchIcon, LoaderIcon, HistoryIcon, TrashIcon } from './components/Icons';
import { AppState, SearchResult } from './types';
import { performSearch } from './services/geminiService';
import SourceCard from './components/SourceCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    history: [],
    currentResult: null,
    isLoading: false,
    error: null,
  });
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, history: parsed }));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('search_history', JSON.stringify(state.history));
  }, [state.history]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { answer, sources } = await performSearch(query);
      
      const newResult: SearchResult = {
        id: Date.now().toString(),
        query,
        answer,
        sources,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        currentResult: newResult,
        history: [newResult, ...prev.history].slice(0, 50), // Keep last 50
        isLoading: false,
      }));
      setInput('');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "An unexpected error occurred.",
      }));
    }
  }, [input, state.isLoading]);

  const selectHistoryItem = (item: SearchResult) => {
    setState(prev => ({ ...prev, currentResult: item }));
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm("Clear all search history?")) {
      setState(prev => ({ ...prev, history: [] }));
    }
  };

  const removeHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, history: prev.history.filter(h => h.id !== id) }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setState(prev => ({ ...prev, currentResult: null }))}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">Q</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">QuickQuery AI</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors relative group"
          >
            <HistoryIcon className="w-5 h-5 text-slate-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Search Section (shown when no result or active search) */}
        {!state.currentResult && !state.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              What can I help you find today?
            </h2>
          </div>
        )}

        {/* Floating Search Bar */}
        <div className={`transition-all duration-300 ${state.currentResult ? 'sticky top-20 z-20 mb-8' : 'w-full max-w-2xl mx-auto mb-12'}`}>
          <form onSubmit={handleSearch} className="relative group">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search anything... (e.g. 'How is the weather in Tokyo?')"
              className="w-full pl-12 pr-16 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="submit"
                disabled={state.isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                {state.isLoading ? <LoaderIcon className="w-5 h-5" /> : 'Search'}
              </button>
            </div>
          </form>
          {state.error && <p className="mt-2 text-sm text-red-500 px-4">{state.error}</p>}
        </div>

        {/* Results View */}
        {(state.isLoading || state.currentResult) && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {state.isLoading ? (
              <div className="space-y-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : state.currentResult && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm">
                <div className="mb-6 flex items-start justify-between">
                  <h3 className="text-2xl font-bold text-slate-900 pr-8">{state.currentResult.query}</h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap pt-2">
                    {new Date(state.currentResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg">
                  {state.currentResult.answer.split('\n').map((para, idx) => (
                    para.trim() ? <p key={idx} className="mb-4">{para}</p> : null
                  ))}
                </div>

                {state.currentResult.sources.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      Sources & Grounding
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {state.currentResult.sources.map((source, idx) => (
                        <SourceCard key={idx} source={source} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* History Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">History</h2>
            <div className="flex gap-2">
              {state.history.length > 0 && (
                <button onClick={clearHistory} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title="Clear all">
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3">
            {state.history.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No search history yet.</p>
              </div>
            ) : (
              state.history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${state.currentResult?.id === item.id ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'}`}
                >
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-1">{item.query}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                    {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button 
                    onClick={(e) => removeHistoryItem(item.id, e)}
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="py-6 px-4 text-center">
        <p className="text-sm text-slate-400">
          Powered by Gemini 3 Flash & Google Search. Information may vary.
        </p>
      </footer>
    </div>
  );
};

export default App;
