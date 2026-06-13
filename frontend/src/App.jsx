import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ShieldAlert, 
  MapPin, 
  UploadCloud, 
  Mic, 
  MicOff, 
  FileText, 
  AlertTriangle,
  Flame,
  Globe,
  HelpCircle,
  EyeOff,
  UserCheck,
  CheckCircle,
  Check,
  Search,
  Phone,
  Lock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon asset mapping issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055';

const CATEGORIES = [
  { id: 'Crime & Violence', label: 'Crime & Violence', desc: 'Theft, assault, vandalism, harassment', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { id: 'Corruption', label: 'Corruption & Bribe', desc: 'Bribes, extortion, abuse of power', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'Cyber Crime', label: 'Cyber Crime', desc: 'Hacking, fraud, phishing, scams', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'Public Safety', label: 'Public Safety', desc: 'Safety hazards, infrastructure failures', icon: ShieldAlert, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'Suspicious Activity', label: 'Suspicious Activity', desc: 'Stalking, drug activity, casing properties', icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'Other', label: 'Other / General', desc: 'Any other safety concerns', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' }
];

const FAQS = [
  {
    q: 'How is my anonymity guaranteed?',
    a: 'SpeakUp does not log IP addresses, browser headers, or session cookies. Reports are stored securely and encrypted. Our reverse proxy completely strips transmission headers before saving database records.'
  },
  {
    q: 'What does AI Privacy Redaction do?',
    a: 'If enabled, the description is scanned prior to saving. Personal names, specific address details, phone numbers, or email addresses are automatically scrubbed and replaced with [REDACTED] to protect your identity.'
  },
  {
    q: 'Who accesses these reports?',
    a: 'Verified law enforcement officials and security personnel review submitted reports inside their dedicated secure portal to initiate investigations or take necessary actions.'
  },
  {
    q: 'Can I edit or delete my report after submitting?',
    a: 'To guarantee absolute anonymity, there are no accounts or edit capabilities. If you have updates or additional evidence, submit a new report and mention the previous Report ID (#SPK-xx) in your description.'
  }
];

export default function App() {
  // Navigation tabs within Citizen view
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'track'

  // Form States
  const [selectedCategory, setSelectedCategory] = useState('Crime & Violence');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [enableRedact, setEnableRedact] = useState(true);
  
  // Location States
  const [includeLocation, setIncludeLocation] = useState(false);
  const [coordinates, setCoordinates] = useState([28.6139, 77.2090]); // Default CP Delhi
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);

  // UI States
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Tracking States
  const [searchId, setSearchId] = useState('');
  const [trackedReport, setTrackedReport] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // FAQ States
  const [openFaq, setOpenFaq] = useState(null);

  const fileInputRef = useRef(null);

  // Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      rec.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [SpeechRecognition]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-text is not supported in this browser. Try Google Chrome or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Get current geolocation
  const handleGetLocation = () => {
    if (!includeLocation) {
      setIncludeLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = [pos.coords.latitude, pos.coords.longitude];
          setCoordinates(newCoords);
          setMapCenter(newCoords);
        },
        (err) => {
          console.warn('Geolocation capture blocked/failed:', err.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIncludeLocation(false);
    }
  };

  // Leaflet map click listener
  function MapEvents() {
    useMapEvents({
      click(e) {
        setCoordinates([e.latlng.lat, e.latlng.lng]);
      }
    });
    return null;
  }

  // Handle Multer upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('evidence', file);

    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEvidenceUrl(res.data.fileUrl);
      setUploadSuccess(true);
    } catch (err) {
      alert('File upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the Title and Description.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        evidence_url: evidenceUrl,
        category: selectedCategory,
        latitude: includeLocation ? coordinates[0] : null,
        longitude: includeLocation ? coordinates[1] : null,
        enable_redact: enableRedact
      };

      const res = await axios.post(`${API_URL}/api/reports`, payload);
      setReportSuccess(res.data.report);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      // Clear form
      setTitle('');
      setDescription('');
      setEvidenceUrl('');
      setUploadSuccess(false);
      setIncludeLocation(false);
    } catch (err) {
      alert('Failed to submit report: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Search for report status
  const handleSearchReport = async (e) => {
    if (e) e.preventDefault();

    // Extract numbers from something like "#SPK-15" or just "15"
    const parsedId = searchId.replace(/\D/g, '');
    if (!parsedId) {
      setTrackingError('Please enter a valid numeric Report ID.');
      setTrackedReport(null);
      return;
    }

    setIsTrackingLoading(true);
    setTrackingError('');
    setTrackedReport(null);

    try {
      const res = await axios.get(`${API_URL}/api/reports/${parsedId}`);
      setTrackedReport(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setTrackingError('No active record found matching this Report ID.');
      } else {
        setTrackingError('Failed to retrieve case status. Please try again later.');
      }
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'Submitted': return 0;
      case 'Under Investigation': return 1;
      case 'Action Taken': return 2;
      case 'Resolved': return 3;
      default: return 0;
    }
  };

  const timelineSteps = [
    { label: 'Submitted', desc: 'Securely logged in the database.' },
    { label: 'Under Investigation', desc: 'Assigned to investigative officer/analyst.' },
    { label: 'Action Taken', desc: 'Action initiated (e.g. evidence check, referral).' },
    { label: 'Resolved', desc: 'Investigation concluded and case closed.' }
  ];

  return (
    <div className="w-full space-y-10">
      
      {/* 2-Column Grid Layout: Main Workspace and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Column: Helplines & Security Seals */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Official Helplines */}
          <div className="bg-[#111827] border-l-2 border-l-[#ff9933] border-y border-r border-white/5 p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 pointer-events-none">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
                alt=""
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#ff9933]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Helplines
              </h3>
            </div>
            <p className="text-[10px] text-slate-400">
              For immediate physical assistance or threat to life, contact emergency dispatchers immediately:
            </p>
            <div className="space-y-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-[#ff9933]/10 border border-white/5 hover:border-[#ff9933]/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  National Emergency
                </span>
                <span className="font-mono text-[#ff9933] font-bold">112</span>
              </a>
              <a
                href="tel:1930"
                className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition duration-200"
              >
                <span>Cyber Crime</span>
                <span className="font-mono text-blue-400 font-bold">1930</span>
              </a>
              <a
                href="tel:1091"
                className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition duration-200"
              >
                <span>Women Helpline</span>
                <span className="font-mono text-emerald-400 font-bold">1091</span>
              </a>
              <a
                href="tel:1098"
                className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition duration-200"
              >
                <span>Child Helpline</span>
                <span className="font-mono text-purple-400 font-bold">1098</span>
              </a>
            </div>
          </div>

          {/* Security Badges */}
          <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Security Protocols
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg mt-0.5">
                  <EyeOff className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Zero-Trace Routing</h4>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    Your IP address and transmission logs are stripped at the proxy level before saving.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">AI Redaction Tunnel</h4>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    Scrubs personal data (names, emails, cell numbers) to keep description text identity-safe.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Encrypted SQL Logs</h4>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    Stored in a secure database cluster using strict access control credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl text-[9px] text-slate-500 text-center leading-relaxed">
            ⚖️ <strong>Disclaimer:</strong> Filing a false report is a criminal offense. Please submit incident details responsibly.
          </div>

        </div>

        {/* Right Columns: Main content & forms */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Inner Citizen Tabs switcher */}
          <div className="flex bg-[#0d1527] p-1 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === 'report'
                  ? 'bg-[#1b365d]/85 text-emerald-400 border border-emerald-500/20 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              File Secure Report
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === 'track'
                  ? 'bg-[#1b365d]/85 text-[#ff9933] border border-[#ff9933]/25 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              Track Incident Status
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'report' ? (
              <motion.div
                key="report-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {reportSuccess ? (
                  <motion.div 
                    className="bg-[#111827] border border-emerald-500/20 p-8 rounded-3xl text-center space-y-6 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-bounce">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white">Report Registered Safely</h2>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Your report has been securely encrypted and added to the queue. An investigative officer will review the case file shortly.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl max-w-sm mx-auto">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Secure Case File Key</div>
                      <div className="text-xl font-mono text-[#ff9933] font-bold mt-1">#SPK-{reportSuccess.id || 'N/A'}</div>
                      <p className="text-[9px] text-slate-500 mt-1">Write this key down to check investigation progress below.</p>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setSearchId(`#SPK-${reportSuccess.id}`);
                          setActiveTab('track');
                          setTimeout(() => handleSearchReport(), 100);
                          setReportSuccess(null);
                        }}
                        className="bg-[#1b365d] hover:bg-[#254b80] text-white border border-blue-500/25 font-bold text-xs px-5 py-2.5 rounded-xl transition duration-200"
                      >
                        Track Progress Now
                      </button>
                      <button
                        onClick={() => setReportSuccess(null)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-200"
                      >
                        Submit Another Incident
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form 
                    onSubmit={handleFormSubmit}
                    className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl"
                  >
                    {/* Step 1: Category */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Incident Category</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const isSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition duration-200 group relative ${
                                isSelected 
                                  ? 'bg-[#1e1e2d] border-red-500/50 shadow-lg shadow-red-500/5' 
                                  : 'bg-slate-900/60 border-white/5 hover:bg-[#151d30]'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${cat.bg} ${cat.color} border ${cat.border} mb-3 group-hover:scale-110 transition duration-200`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="text-xs font-bold text-white mb-0.5">{cat.label}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{cat.desc}</div>
                              {isSelected && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Title & Description */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Incident Details</h3>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-semibold">Incident Title</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-white/5 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition"
                          placeholder="Brief summary (e.g. Theft in Sector 4 Market)"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] text-slate-400 font-semibold">Detailed Description</label>
                          <button
                            type="button"
                            onClick={toggleRecording}
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition duration-200 ${
                              isRecording 
                                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {isRecording ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-red-400" />}
                            {isRecording ? 'Listening...' : 'Dictate Speech'}
                          </button>
                        </div>
                        
                        <textarea
                          rows={4}
                          className="w-full bg-slate-900 border border-white/5 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition resize-none"
                          placeholder="Provide a thorough explanation. What occurred? When? Mention vehicle numbers or physical markings if available."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Step 3: Evidence Upload */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Upload Evidence (Optional)</h3>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,video/*,application/pdf"
                      />

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                          uploadSuccess 
                            ? 'border-emerald-500/30 bg-emerald-500/5' 
                            : 'border-white/10 bg-slate-900 hover:bg-[#151d30] hover:border-white/20'
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
                            <span className="text-[10px] text-slate-400">Encrypting & uploading...</span>
                          </div>
                        ) : uploadSuccess ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                              <Check className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-emerald-400">Evidence Uploaded Successfully</span>
                            <span className="text-[9px] text-slate-500 max-w-xs truncate">{evidenceUrl}</span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-slate-400" />
                            <span className="text-[11px] font-bold text-white">Drag & drop or browse files</span>
                            <span className="text-[9px] text-slate-500">Images, videos, or PDFs up to 50MB</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Geotag Location */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">4. Incident Location (Optional)</h3>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border transition duration-200 ${
                            includeLocation 
                              ? 'bg-red-500/15 border-red-500/30 text-red-400' 
                              : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {includeLocation ? 'Location Coordinates Captured' : 'Attach Coordinates'}
                        </button>
                      </div>

                      {includeLocation && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-400">
                            📍 Lat: <span className="font-semibold text-white">{coordinates[0].toFixed(5)}</span>, Lng: <span className="font-semibold text-white">{coordinates[1].toFixed(5)}</span>. Adjust tag location below:
                          </p>
                          <div className="h-[200px] rounded-xl overflow-hidden border border-white/5 shadow-inner">
                            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker position={coordinates} />
                              <MapEvents />
                            </MapContainer>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 5: AI Redaction Toggle */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                          <ShieldAlert className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Enable AI Privacy Redaction</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Scrub personal names, phone numbers, and addresses automatically.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-red-600 border-slate-700 bg-slate-900 rounded focus:ring-red-500 focus:ring-offset-slate-900 focus:ring-2"
                        checked={enableRedact}
                        onChange={() => setEnableRedact(!enableRedact)}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Encrypting & Logging incident...
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          File Anonymous Report
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="track-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#ff9933]" />
                    Anonymous Incident Status Tracker
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input your alphanumeric Case File Key (e.g. #SPK-12 or just 12) below to track real-time processing status.
                  </p>
                </div>
                
                <form onSubmit={handleSearchReport} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="Enter Report ID (e.g., #SPK-12)"
                      className="w-full bg-slate-900 border border-white/5 focus:border-[#ff9933]/50 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTrackingLoading}
                    className="bg-[#1b365d] hover:bg-[#254b80] text-white font-bold text-xs px-5 py-3 rounded-xl border border-blue-500/20 active:scale-[0.98] transition flex items-center gap-1.5"
                  >
                    {isTrackingLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Search
                      </>
                    )}
                  </button>
                </form>

                {trackingError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {/* Case Status Result details */}
                <AnimatePresence mode="wait">
                  {trackedReport ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6 border-t border-white/5 pt-6"
                    >
                      {/* Header Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 border border-white/5 p-4 rounded-xl text-xs">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Case Key</div>
                          <div className="text-base font-mono font-bold text-white mt-0.5">#SPK-{trackedReport.id}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Category</div>
                          <div className="text-xs font-semibold text-slate-300 mt-1">{trackedReport.category}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Registration Date</div>
                          <div className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(trackedReport.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                        </div>
                      </div>

                      {/* Visual Timeline */}
                      <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#ff9933]" />
                          Investigation Status Timeline
                        </h4>
                        
                        <div className="relative pl-6 border-l border-slate-800/80 space-y-6">
                          {timelineSteps.map((step, idx) => {
                            const isActive = idx <= getStatusStepIndex(trackedReport.status);
                            const isCurrent = idx === getStatusStepIndex(trackedReport.status);
                            return (
                              <div key={idx} className="relative">
                                {/* Bullet Node */}
                                <span className={`absolute -left-[32px] top-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                  isActive 
                                    ? isCurrent
                                      ? 'bg-[#ff9933] border-[#ff9933] text-white shadow-[0_0_8px_rgba(255,153,51,0.5)]'
                                      : 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-600'
                                }`}>
                                  {isActive && idx < getStatusStepIndex(trackedReport.status) ? (
                                    <Check className="w-2.5 h-2.5" />
                                  ) : (
                                    <span className="text-[8px] font-bold">{idx + 1}</span>
                                  )}
                                </span>
                                
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                      {step.label}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[8px] font-bold bg-[#ff9933]/15 text-[#ff9933] border border-[#ff9933]/25 px-1.5 py-0.5 rounded-md">
                                        Current Stage
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[10px] leading-relaxed ${isActive ? 'text-slate-350' : 'text-slate-550'}`}>
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Official Remarks Log */}
                      <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#ff9933]" />
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Action Logs / remarks</h4>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed font-sans border-l border-[#ff9933]/30 pl-3 py-0.5">
                          {trackedReport.admin_remarks || 'The incident report is registered and awaits dispatch queue triage. No official action log comments have been registered by the investigating officer yet.'}
                        </div>
                      </div>

                      {/* Details Summary Preview */}
                      <div className="border border-white/5 rounded-xl p-4 bg-slate-900/20 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Incident Preview</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <span className="text-slate-500">Title:</span>
                            <span className="text-slate-300 ml-1.5 font-semibold">{trackedReport.title}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Urgency Classification:</span>
                            <span className={`ml-1.5 font-bold ${
                              trackedReport.severity === 'High' ? 'text-red-400' : 
                              trackedReport.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>{trackedReport.severity}</span>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="text-slate-500">Sanitized Description:</span>
                          <p className="text-slate-350 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-white/5 font-mono text-[10px]">
                            {trackedReport.description}
                          </p>
                        </div>
                      </div>

                    </motion.div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-3">
                      <HelpCircle className="w-8 h-8 text-slate-650" />
                      <span className="text-xs">Provide a valid case key to display logs.</span>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>

      {/* Accordion FAQ Section */}
      <div className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-3xl space-y-4 shadow-2xl max-w-6xl mx-auto">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          Frequently Asked Questions (Citizen Portal Information)
        </h3>
        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left py-2 text-xs font-semibold text-slate-200 hover:text-white transition duration-200"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[10px] text-slate-400 leading-relaxed pt-1 pb-2 font-medium">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
