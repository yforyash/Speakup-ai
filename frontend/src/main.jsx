import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import Admin from './Admin';
import { ShieldCheck, Lock, UserCog, ClipboardList } from 'lucide-react';

function SpeakUpApp() {
  const [view, setView] = useState('form');

  return (
    <div className="min-h-screen bg-[#060a13] text-[#f1f5f9] flex flex-col items-center justify-start pb-16 font-sans">
      
      {/* Top National Tricolor Accent Bar */}
      <div className="w-full h-1.5 flex">
        <div className="flex-1 bg-[#ff9933]"></div> {/* Saffron */}
        <div className="flex-1 bg-white"></div>       {/* White */}
        <div className="flex-1 bg-[#138808]"></div>   {/* Green */}
      </div>

      {/* Official Government Header Banner */}
      <header className="w-full bg-[#0d1527] border-b border-white/5 shadow-2xl py-5 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Emblem & Ministry info */}
          <div className="flex items-center gap-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
              alt="National Emblem of India"
              className="w-12 h-12 brightness-110 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
            />
            <div className="border-l border-white/10 pl-4 space-y-0.5">
              <div className="text-[10px] text-[#ff9933] font-bold tracking-widest uppercase">
                गृह मंत्रालय | Ministry of Home Affairs
              </div>
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                राष्ट्रीय अपराध रिपोर्टिंग पोर्टल
              </h1>
              <div className="text-[11px] text-emerald-400 font-semibold tracking-wide flex items-center gap-1">
                National Crime Reporting Portal (Simulation)
              </div>
              <div className="text-[9px] text-slate-400 font-medium">
                सत्यमेव जयते | Truth Alone Triumphs
              </div>
            </div>
          </div>
          
          {/* Secure Trust Badge */}
          <div className="flex items-center gap-3 bg-[#1e293b]/40 border border-white/5 px-4 py-2.5 rounded-xl shadow-inner">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Zero-Trace Network</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                256-Bit SSL Secured
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Trust reassurance bar */}
      <div className="w-full bg-[#1e293b]/20 border-b border-white/5 py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>No login or registration required. Your IP address is automatically scrubbed by our proxy server.</span>
        </div>
      </div>

      {/* Navigation Capsule Tab Controller */}
      <div className="mt-8 flex bg-[#0d1527] p-1.5 rounded-xl border border-white/5 shadow-2xl">
        <button
          onClick={() => setView('form')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
            view === 'form' 
              ? 'bg-[#1b365d] text-white shadow-lg border border-blue-500/30' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Citizen Reporting Portal
        </button>
        <button
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
            view === 'admin' 
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/30' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCog className="w-4 h-4" />
          Law Enforcement Login
        </button>
      </div>

      {/* Main Content Body */}
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
