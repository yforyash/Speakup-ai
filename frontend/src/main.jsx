import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import Admin from './Admin';
import { ShieldCheck, Lock, UserCog, ClipboardList } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    mha: "गृह मंत्रालय | Ministry of Home Affairs",
    ncrp: "राष्ट्रीय अपराध रिपोर्टिंग पोर्टल",
    ncrp_sub: "National Crime Reporting Portal (Simulation)",
    satyamev: "सत्यमेव जयते | Truth Alone Triumphs",
    ssl: "256-Bit SSL Secured",
    zero_trace: "Zero-Trace Network",
    notice: "No login or registration required. Your IP address is automatically scrubbed by our proxy server.",
    tab_citizen: "Citizen Reporting Portal",
    tab_admin: "Law Enforcement Login",
    ticker: "⚠️ SECURITY NOTICE: Ministry of Home Affairs never calls or emails citizens requesting passcode coordinates or OTPs. File reports safely. For financial scams, dial 1930 immediately."
  },
  hi: {
    mha: "गृह मंत्रालय | Ministry of Home Affairs",
    ncrp: "राष्ट्रीय अपराध रिपोर्टिंग पोर्टल",
    ncrp_sub: "राष्ट्रीय अपराध रिपोर्टिंग पोर्टल (सिमुलेशन)",
    satyamev: "सत्यमेव जयते",
    ssl: "256-Bit SSL सुरक्षित",
    zero_trace: "शून्य-ट्रैक नेटवर्क",
    notice: "कोई लॉगिन या पंजीकरण आवश्यक नहीं है। आपका आईपी पता हमारे प्रॉक्सी सर्वर द्वारा स्वचालित रूप से हटा दिया जाता है।",
    tab_citizen: "नागरिक रिपोर्टिंग पोर्टल",
    tab_admin: "कानून प्रवर्तन लॉगिन",
    ticker: "⚠️ सुरक्षा सूचना: गृह मंत्रालय कभी भी नागरिकों से पासकोड या ओटीपी के लिए कॉल या ईमेल नहीं करता है। वित्तीय धोखाधड़ी के लिए तुरंत 1930 डायल करें।"
  }
};

function SpeakUpApp() {
  const [view, setView] = useState('form');
  const [language, setLanguage] = useState('en');
  const [textSize, setTextSize] = useState('normal');

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'large': return 'text-[105%]';
      case 'xlarge': return 'text-[110%]';
      default: return 'text-[100%]';
    }
  };

  const t = TRANSLATIONS[language];

  return (
    <div className={`min-h-screen bg-[#060a13] text-[#f1f5f9] flex flex-col items-center justify-start pb-16 font-sans transition-all duration-200 ${getTextSizeClass()}`}>
      
      {/* Top Accessibility & Language Toolbar */}
      <div className="w-full bg-[#03060c] border-b border-white/5 py-1.5 px-6 text-[10px] text-slate-400">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Left: Government of India info */}
          <div className="flex items-center gap-2 font-semibold">
            <span>भारत सरकार | Government of India</span>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Text resizing */}
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
              <button 
                onClick={() => setTextSize('normal')} 
                className={`px-1.5 py-0.5 rounded font-bold hover:text-white transition ${textSize === 'normal' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                title="Normal Font Size"
              >
                A
              </button>
              <button 
                onClick={() => setTextSize('large')} 
                className={`px-1.5 py-0.5 rounded font-bold hover:text-white transition ${textSize === 'large' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                title="Large Font Size"
              >
                A+
              </button>
              <button 
                onClick={() => setTextSize('xlarge')} 
                className={`px-1.5 py-0.5 rounded font-bold hover:text-white transition ${textSize === 'xlarge' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                title="Extra Large Font Size"
              >
                A++
              </button>
            </div>

            {/* Language switcher */}
            <div className="flex items-center gap-2 font-bold">
              <button 
                onClick={() => setLanguage('en')} 
                className={`hover:text-white transition ${language === 'en' ? 'text-[#ff9933]' : 'text-slate-500'}`}
              >
                English
              </button>
              <span className="text-slate-700">|</span>
              <button 
                onClick={() => setLanguage('hi')} 
                className={`hover:text-white transition ${language === 'hi' ? 'text-[#ff9933]' : 'text-slate-500'}`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top National Tricolor Accent Bar */}
      <div className="w-full h-1.5 flex">
        <div className="flex-1 bg-[#ff9933]"></div> {/* Saffron */}
        <div className="flex-1 bg-white"></div>       {/* White */}
        <div className="flex-1 bg-[#138808]"></div>   {/* Green */}
      </div>

      {/* Official Government Header Banner */}
      <header className="w-full bg-[#0d1527] border-b border-white/5 shadow-2xl py-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Emblem & Ministry info */}
          <div className="flex items-center gap-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
              alt="National Emblem of India"
              className="w-10 h-10 brightness-110 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
            />
            <div className="border-l border-white/10 pl-4 space-y-0.5">
              <div className="text-[9px] text-[#ff9933] font-bold tracking-widest uppercase">
                {t.mha}
              </div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t.ncrp}
              </h1>
              <div className="text-[10px] text-emerald-450 font-bold tracking-wide flex items-center gap-1">
                {t.ncrp_sub}
              </div>
              <div className="text-[8px] text-slate-400 font-medium">
                {t.satyamev}
              </div>
            </div>
          </div>
          
          {/* Secure Trust Badge */}
          <div className="flex items-center gap-3 bg-[#1e293b]/40 border border-white/5 px-4 py-2 rounded-xl shadow-inner">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">{t.zero_trace}</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping animate-duration-1000"></span>
                {t.ssl}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Dynamic News Ticker */}
      <div className="w-full bg-[#1b365d]/10 border-b border-white/5 py-1.5 px-6 overflow-hidden relative">
        <div className="max-w-6xl mx-auto flex items-center gap-4 text-xs font-semibold">
          <span className="bg-red-600 text-white text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded flex-shrink-0 animate-pulse">
            Notice
          </span>
          <div className="relative flex-1 overflow-hidden h-4">
            <div className="absolute whitespace-nowrap text-slate-350 animate-marquee text-[11px] font-medium">
              {t.ticker}
            </div>
          </div>
        </div>
      </div>

      {/* Trust reassurance bar */}
      <div className="w-full bg-[#1e293b]/20 border-b border-white/5 py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{t.notice}</span>
        </div>
      </div>

      {/* Navigation Capsule Tab Controller */}
      <div className="mt-8 flex bg-[#0d1527] p-1.5 rounded-xl border border-white/5 shadow-2xl">
        <button
          onClick={() => setView('form')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            view === 'form' 
              ? 'bg-[#1b365d] text-white shadow-lg border border-blue-500/30' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {t.tab_citizen}
        </button>
        <button
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            view === 'admin' 
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/30' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCog className="w-4 h-4" />
          {t.tab_admin}
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
