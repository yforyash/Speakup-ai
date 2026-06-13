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
  ShieldCheck,
  User,
  ShieldX,
  CheckCircle2,
  ChevronRight,
  ExternalLink
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
    a: 'For Anonymous Reports, SpeakUp does not log IP addresses, browser headers, or cookies. Our reverse proxy completely strips transmission headers before saving database records.'
  },
  {
    q: 'What is the difference between an Anonymous Report and an e-FIR?',
    a: 'An Anonymous Report scrubs your identity completely and is used for intelligence gathering. An e-FIR (First Information Report) is an official legal complaint that requires identity verification (Gov ID upload) and complainant contact details, which are kept strictly confidential under high-grade database encryption.'
  },
  {
    q: 'Who accesses these reports?',
    a: 'Verified law enforcement officials and security personnel review submitted reports inside their dedicated secure portal to initiate investigations or take necessary actions.'
  },
  {
    q: 'Can I track the progress of an anonymous report or an e-FIR?',
    a: 'Yes. Upon successful submission, you receive a Secure Case File Key (e.g. #SPK-12 or #FIR-105). Input this key in the "Track Case Status" panel to inspect active investigation logs and remarks.'
  }
];

export default function App() {
  // Navigation tabs within Citizen view
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'fir' | 'track' | 'registry'

  // General Form States
  const [selectedCategory, setSelectedCategory] = useState('Crime & Violence');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [enableRedact, setEnableRedact] = useState(true);
  
  // Location States
  const [includeLocation, setIncludeLocation] = useState(false);
  const [coordinates, setCoordinates] = useState([28.6139, 77.2090]); // Default CP Delhi
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);

  // e-FIR specific complainant states
  const [complainantName, setComplainantName] = useState('');
  const [complainantContact, setComplainantContact] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idDocumentUrl, setIdDocumentUrl] = useState('');
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [idUploadSuccess, setIdUploadSuccess] = useState(false);

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

  // Public Registry States
  const [registryReports, setRegistryReports] = useState([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [selectedRegistryReport, setSelectedRegistryReport] = useState(null);
  const [filterRegCategory, setFilterRegCategory] = useState('All');
  const [filterRegStatus, setFilterRegStatus] = useState('All');

  // FAQ States
  const [openFaq, setOpenFaq] = useState(null);

  const fileInputRef = useRef(null);
  const idFileInputRef = useRef(null);

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

  // Fetch Public Registry cases when tab is selected
  useEffect(() => {
    if (activeTab === 'registry') {
      fetchRegistryReports();
    }
  }, [activeTab]);

  const fetchRegistryReports = async () => {
    setRegistryLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/reports`);
      setRegistryReports(res.data);
      if (res.data.length > 0) {
        setSelectedRegistryReport(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch registry logs:', err);
    } finally {
      setRegistryLoading(false);
    }
  };

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

  // Handle upload of evidence file
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

  // Handle upload of Complainant Government ID Document
  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingId(true);
    setIdUploadSuccess(false);

    const formData = new FormData();
    formData.append('evidence', file);

    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIdDocumentUrl(res.data.fileUrl);
      setIdUploadSuccess(true);
    } catch (err) {
      alert('Identity document upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploadingId(false);
    }
  };

  // Handle form submit (Both Anonymous Report & e-FIR)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the Title and Description.');
      return;
    }

    if (activeTab === 'fir') {
      if (!complainantName.trim() || !complainantContact.trim()) {
        alert('Please fill out Complainant Name and Contact details.');
        return;
      }
      if (!idDocumentUrl) {
        alert('Please upload a Government ID verification document for the e-FIR.');
        return;
      }
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
        enable_redact: activeTab === 'report' ? enableRedact : false,
        report_type: activeTab, // 'report' (anonymous) or 'fir'
        identity_document_url: activeTab === 'fir' ? idDocumentUrl : null,
        complainant_name: activeTab === 'fir' ? complainantName : null,
        complainant_contact: activeTab === 'fir' ? complainantContact : null
      };

      const res = await axios.post(`${API_URL}/api/reports`, payload);
      setReportSuccess(res.data.report);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      // Clear forms
      setTitle('');
      setDescription('');
      setEvidenceUrl('');
      setUploadSuccess(false);
      setIncludeLocation(false);
      setComplainantName('');
      setComplainantContact('');
      setIdDocumentUrl('');
      setIdUploadSuccess(false);
    } catch (err) {
      alert('Failed to submit: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Search for case status
  const handleSearchReport = async (e) => {
    if (e) e.preventDefault();

    const parsedId = searchId.replace(/\D/g, '');
    if (!parsedId) {
      setTrackingError('Please enter a valid numeric Case ID.');
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
        setTrackingError('No active case records found matching this identifier.');
      } else {
        setTrackingError('Failed to retrieve case status. Please try again.');
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

  // Filter Registry Reports
  const filteredRegReports = registryReports.filter(rep => {
    const matchCat = filterRegCategory === 'All' || rep.category === filterRegCategory;
    const matchStat = filterRegStatus === 'All' || rep.status === filterRegStatus;
    return matchCat && matchStat;
  });

  return (
    <div className="w-full space-y-10">
      
      {/* 2-Column Grid Layout: Side Info Column and Main Action Frame */}
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
                  <h4 className="text-[11px] font-bold text-white">Identity Protection</h4>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    Anonymous reports scrub personal names. e-FIR complainant details are strictly encrypted.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Secure Cloud Vault</h4>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    Hosted in a high-grade PostgreSQL cluster with end-to-end TLS database validation.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Columns: Main content, forms & public registry */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Inner Citizen Tabs switcher - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-[#0d1527] p-1 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'report'
                  ? 'bg-[#1b365d]/85 text-emerald-400 border border-emerald-500/20 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Anonymous
            </button>
            <button
              onClick={() => setActiveTab('fir')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'fir'
                  ? 'bg-[#1b365d]/85 text-amber-500 border border-amber-500/20 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              File e-FIR
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'track'
                  ? 'bg-[#1b365d]/85 text-[#ff9933] border border-[#ff9933]/25 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Track Case
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'registry'
                  ? 'bg-[#1b365d]/85 text-blue-450 border border-blue-500/20 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Public Cases
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* 1. Submitting Anonymous Reports */}
            {activeTab === 'report' && (
              <motion.div
                key="report-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {reportSuccess ? (
                  <div className="bg-[#111827] border border-emerald-500/20 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white">Anonymous Report Registered</h2>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Your incident has been securely logged without identifying information.
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl max-w-sm mx-auto">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Secure Case File Key</div>
                      <div className="text-xl font-mono text-[#ff9933] font-bold mt-1">#SPK-{reportSuccess.id}</div>
                    </div>
                    <button
                      onClick={() => setReportSuccess(null)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                    >
                      File Another Incident
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-white uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        Anonymous Incident Intelligence Triage
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        This route scrubs your personal name, contact details, and location maps. Strictly for general public safety feeds.
                      </p>
                    </div>

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
                              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition duration-205 group relative ${
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
                              {isSelected && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
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
                          <div className="h-[200px] rounded-xl overflow-hidden border border-white/5">
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
                          <div className="text-[9px] text-slate-400 mt-0.5">Scrub names, phone numbers, and addresses dynamically.</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-red-600 border-slate-700 bg-slate-900 rounded focus:ring-red-500"
                        checked={enableRedact}
                        onChange={() => setEnableRedact(!enableRedact)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-red-650/15"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Scrubbing PII & Registering...
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
            )}

            {/* 2. Submitting e-FIR Files (Complainant verified) */}
            {activeTab === 'fir' && (
              <motion.div
                key="fir-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {reportSuccess ? (
                  <div className="bg-[#111827] border border-emerald-500/20 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <FileCheck className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white">Official e-FIR Filed Successfully</h2>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Your legal complainant verification has been securely registered in the Home Ministry data vault.
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl max-w-sm mx-auto">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Official e-FIR ID</div>
                      <div className="text-xl font-mono text-amber-500 font-bold mt-1">#FIR-{reportSuccess.id}</div>
                    </div>
                    <button
                      onClick={() => setReportSuccess(null)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                    >
                      File Another e-FIR
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-white uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        Official Complainant Verified e-FIR Filing
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        File an official First Information Report. Requires Government ID verification. Complainant details are held under strict security.
                      </p>
                    </div>

                    {/* Complainant Identity Verification */}
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
                      <h4 className="text-xs font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
                        <User className="w-4 h-4 text-amber-500" />
                        Complainant Credentials
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Full Legal Name</label>
                          <input
                            type="text"
                            required
                            value={complainantName}
                            onChange={(e) => setComplainantName(e.target.value)}
                            placeholder="e.g. Rajesh Kumar"
                            className="w-full bg-slate-900 border border-white/5 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Contact Number / Email</label>
                          <input
                            type="text"
                            required
                            value={complainantContact}
                            onChange={(e) => setComplainantContact(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            className="w-full bg-slate-900 border border-white/5 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div className="sm:col-span-1 space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Govt ID Type</label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                          >
                            <option value="Aadhaar Card">Aadhaar Card</option>
                            <option value="Passport">Passport</option>
                            <option value="PAN Card">PAN Card</option>
                            <option value="Voter ID">Voter ID</option>
                          </select>
                        </div>
                        
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Upload Govt ID Copy (PDF / Image)</label>
                          <input
                            type="file"
                            ref={idFileInputRef}
                            className="hidden"
                            onChange={handleIdUpload}
                            accept="image/*,application/pdf"
                          />
                          <button
                            type="button"
                            onClick={() => idFileInputRef.current?.click()}
                            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition duration-200 ${
                              idUploadSuccess 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {isUploadingId ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-amber-500 rounded-full animate-spin"></div>
                            ) : (
                              <UploadCloud className="w-4 h-4" />
                            )}
                            {isUploadingId ? 'Uploading ID Document...' : idUploadSuccess ? 'Govt ID Document Verified' : 'Browse ID file'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Incident specifications */}
                    <div className="space-y-4 pt-2">
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Incident Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-3 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-semibold">Incident Title</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Brief legal summary of complaint"
                          className="w-full bg-slate-900 border border-white/5 focus:border-amber-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-semibold">Legal Incident Statement (Unaltered Description)</label>
                        <textarea
                          rows={4}
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Please detail the incident precisely. Mention dates, times, names of suspects if known, and specific order of events."
                          className="w-full bg-slate-900 border border-white/5 focus:border-amber-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition resize-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Step 3: Evidence Upload */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-semibold">3. Attach Evidentiary Files</h3>
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
                            <div className="w-6 h-6 border-2 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
                            <span className="text-[10px] text-slate-400">Uploading secure payload...</span>
                          </div>
                        ) : uploadSuccess ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                              <Check className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-emerald-400">Evidence Uploaded successfully</span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-slate-400" />
                            <span className="text-[11px] font-bold text-white">Drag & drop or browse files</span>
                            <span className="text-[9px] text-slate-500">Attach photos, videos, or legal PDFs</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Geotag Location */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">4. Incident Location Tag</h3>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border transition duration-200 ${
                            includeLocation 
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-405' 
                              : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {includeLocation ? 'Coordinates Attached' : 'Attach Coordinates'}
                        </button>
                      </div>
                      {includeLocation && (
                        <div className="h-[200px] rounded-xl overflow-hidden border border-white/5">
                          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={coordinates} />
                            <MapEvents />
                          </MapContainer>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-amber-600/15"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Filing official e-FIR...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          File Legal e-FIR
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* 3. Tracking Case Files */}
            {activeTab === 'track' && (
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
                    Incident Status & e-FIR Tracker
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input your Case Key (#SPK-xx) or e-FIR Key (#FIR-xx) below to track real-time processing status.
                  </p>
                </div>
                
                <form onSubmit={handleSearchReport} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="e.g. #SPK-12 or #FIR-7"
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
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

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
                          <div className="text-base font-mono font-bold text-white mt-0.5">
                            {trackedReport.report_type === 'fir' ? `#FIR-${trackedReport.id}` : `#SPK-${trackedReport.id}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Classification</div>
                          <div className="text-xs font-semibold text-slate-350 mt-1 uppercase flex items-center gap-1">
                            {trackedReport.report_type === 'fir' ? (
                              <span className="text-amber-500">Legal e-FIR</span>
                            ) : (
                              <span className="text-emerald-400">Anonymous Report</span>
                            )}
                          </div>
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
                          {trackedReport.admin_remarks || 'The case file is queued for police triage. No official actions logged yet.'}
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
                          <span className="text-slate-500">Description:</span>
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

            {/* 4. Public Cases Registry (Transparency Dashboard) */}
            {activeTab === 'registry' && (
              <motion.div
                key="registry-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Intro */}
                <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl space-y-1.5 shadow-xl">
                  <h3 className="text-sm font-extrabold text-white uppercase flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    Public Case Registry & Transparency Board
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    This registry allows citizens to monitor active and pending incident statistics and official action logs. To protect witness safety and complainant privacy, confidential descriptions, coordinates, and upload documents are masked.
                  </p>
                </div>

                {/* Main registry panel with list & masked inspector */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Left Column: Filter and Tally list (2/5 size) */}
                  <div className="md:col-span-2 bg-[#111827] border border-white/5 p-4 rounded-2xl space-y-3 shadow-xl">
                    
                    {/* Tiny Category/Status Filters */}
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-white/5">
                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
                        <select
                          value={filterRegCategory}
                          onChange={(e) => setFilterRegCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 rounded-lg p-1.5 text-[10px] text-slate-300 outline-none"
                        >
                          <option value="All">All Categories</option>
                          <option value="Crime & Violence">Crime & Violence</option>
                          <option value="Corruption">Corruption</option>
                          <option value="Cyber Crime">Cyber Crime</option>
                          <option value="Public Safety">Public Safety</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                        <select
                          value={filterRegStatus}
                          onChange={(e) => setFilterRegStatus(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 rounded-lg p-1.5 text-[10px] text-slate-300 outline-none"
                        >
                          <option value="All">All Status</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Under Investigation">Under Investigation</option>
                          <option value="Action Taken">Action Taken</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {registryLoading ? (
                        <div className="space-y-2 animate-pulse">
                          {[1, 2].map(i => (
                            <div key={i} className="h-16 bg-slate-900 rounded-xl"></div>
                          ))}
                        </div>
                      ) : filteredRegReports.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 text-[10px]">
                          No public records matching filters.
                        </div>
                      ) : (
                        filteredRegReports.map((rep) => {
                          const isSelected = selectedRegistryReport?.id === rep.id;
                          return (
                            <button
                              key={rep.id}
                              type="button"
                              onClick={() => setSelectedRegistryReport(rep)}
                              className={`w-full text-left p-2.5 rounded-xl border text-[11px] transition duration-200 flex flex-col gap-1 ${
                                isSelected 
                                  ? 'bg-[#1e1e2d] border-blue-500/30' 
                                  : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/60'
                              }`}
                            >
                              <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-500">
                                <span>{rep.report_type === 'fir' ? `#FIR-${rep.id}` : `#SPK-${rep.id}`}</span>
                                <span className={rep.report_type === 'fir' ? 'text-amber-500' : 'text-emerald-400'}>
                                  {rep.report_type === 'fir' ? 'e-FIR' : 'Anonymous'}
                                </span>
                              </div>
                              <div className="font-bold text-white line-clamp-1">{rep.title}</div>
                              
                              <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1">
                                <span>{rep.category}</span>
                                <span className={`px-1.5 py-0.5 rounded border text-[8px] ${STATUS_STYLING[rep.status] || 'bg-slate-800'}`}>
                                  {rep.status}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Masked Inspector details (3/5 size) */}
                  <div className="md:col-span-3 bg-[#111827] border border-white/5 p-5 rounded-2xl space-y-4 shadow-xl">
                    {selectedRegistryReport ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-white/5">
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono">
                              Public Registry ID: {selectedRegistryReport.report_type === 'fir' ? `#FIR-${selectedRegistryReport.id}` : `#SPK-${selectedRegistryReport.id}`}
                            </span>
                            <h3 className="text-xs font-bold text-white mt-0.5">{selectedRegistryReport.title}</h3>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${STATUS_STYLING[selectedRegistryReport.status]}`}>
                            {selectedRegistryReport.status}
                          </span>
                        </div>

                        {/* Masked details message */}
                        <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                            <ShieldX className="w-4 h-4 text-red-500" />
                            Security Protection Active
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Due to witness confidentiality protocols, investigation case files are encrypted. Public access is restricted to official action logs.
                          </p>
                        </div>

                        {/* Case specifics */}
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-slate-500 font-medium block">Report Category</span>
                            <span className="text-slate-300 font-bold mt-0.5 block">{selectedRegistryReport.category}</span>
                          </div>
                          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                            <span className="text-slate-500 font-medium block">Urgency Classification</span>
                            <span className={`font-bold mt-0.5 block ${
                              selectedRegistryReport.severity === 'High' ? 'text-red-400' : 'text-emerald-400'
                            }`}>{selectedRegistryReport.severity}</span>
                          </div>
                        </div>

                        {/* Masked Narrative */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Incident Narrative</label>
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 text-[10px] text-slate-500 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>🔒 Description details masked for public safety.</span>
                          </div>
                        </div>

                        {/* Masked Evidence */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Evidentiary Attachments</label>
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 text-[10px] text-slate-500 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>🔒 Evidence file encrypted in cloud storage.</span>
                          </div>
                        </div>

                        {/* Transparent Action log */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Action remarks</h4>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed font-sans border-l border-emerald-500/30 pl-3">
                            {selectedRegistryReport.admin_remarks || 'Incident is registered. Awaiting initial officer dispatch details.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-600 text-xs">
                        Select a report from the list to review action progress.
                      </div>
                    )}
                  </div>

                </div>
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

const STATUS_STYLING = {
  Submitted: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  'Under Investigation': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'Action Taken': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  Resolved: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
};
