import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import Admin from './Admin';
import { ShieldAlert, Send, LayoutDashboard } from 'lucide-react';

function SpeakUpApp() {
  const [view, setView] = useState('form');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f1f5f9] flex flex-col items-center justify-start pb-12 font-sans">
      {/* Header Banner */}
      <header className="w-full bg-[#111827]/80 backdrop-filter backdrop-blur-lg border-b border-white/5 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#cbd5e1] to-[#64748b] bg-clip-text text-transparent">
                SpeakUp
              </h1>
              <p className="text-[10px] text-red-400 font-semibold tracking-wider uppercase">
                Anonymous Intelligence Network
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Secured & Active
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="mt-8 flex bg-[#111827] p-1.5 rounded-xl border border-white/5 shadow-2xl">
        <button
          onClick={() => setView('form')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
            view === 'form' 
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Send className="w-4 h-4" />
          Submit Report
        </button>
        <button
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
            view === 'admin' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Admin Dashboard
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-6xl px-6 mt-8">
        {view === 'form' ? <App /> : <Admin />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpeakUpApp />
  </StrictMode>
);
