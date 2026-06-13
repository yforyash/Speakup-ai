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
  { id: 'Crime & Violence', label: 'Crime & Violence', desc: 'Theft, assault, vandalism, harassment', icon: Flame, color: 'text-red-650', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { id: 'Corruption', label: 'Corruption & Bribe', desc: 'Bribes, extortion, abuse of power', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'Cyber Crime', label: 'Cyber Crime', desc: 'Hacking, fraud, phishing, scams', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'Public Safety', label: 'Public Safety', desc: 'Safety hazards, infrastructure failures', icon: ShieldAlert, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'Suspicious Activity', label: 'Suspicious Activity', desc: 'Stalking, drug activity, casing properties', icon: HelpCircle, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'Other', label: 'Other / General', desc: 'Any other safety concerns', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
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

const NODAL_OFFICERS = [
  { state: 'Delhi', officer: 'Sh. Rajesh Kumar, IPS', email: 'cp.delhi@gov.in', contact: '011-23490012' },
  { state: 'Maharashtra', officer: 'Sh. Sanjay Pandey, IPS', email: 'cyber.maharashtra@gov.in', contact: '022-22620111' },
  { state: 'Karnataka', officer: 'Smt. G. Radhika, IPS', email: 'sp.cybercrime@ksp.gov.in', contact: '080-22375522' },
  { state: 'Tamil Nadu', officer: 'Sh. A. G. Babu, IPS', email: 'sp.cybertamil@gov.in', contact: '044-28447733' },
  { state: 'Uttar Pradesh', officer: 'Sh. Triveni Singh, IPS', email: 'sp.cyberup@gov.in', contact: '0522-2206110' },
  { state: 'West Bengal', officer: 'Sh. Harikrishna Dwivedi, IAS', email: 'cybercell.wb@gov.in', contact: '033-22145400' },
  { state: 'Gujarat', officer: 'Sh. Amit Vishwakarma, IPS', email: 'cyber.gujarat@gov.in', contact: '079-23250798' },
  { state: 'Rajasthan', officer: 'Sh. Hawa Singh Ghumaria, IPS', email: 'sp.cyber.jaipur@gov.in', contact: '0141-2608447' }
];

const ADVISORIES = [
  { id: 1, title: 'Urgent Advisory: UPI Phishing Scams disguised as tax refunds', date: 'June 12, 2026', severity: 'Critical', desc: 'Fraudulent SMS portals are prompting citizens to download APK payloads for tax returns.' },
  { id: 2, title: 'Advisory on Ransomware targeting local Municipal servers', date: 'May 28, 2026', severity: 'High', desc: 'Keep local file backups and disable SMB ports unless authenticated through secure networks.' },
  { id: 3, title: 'National Cyber Security Awareness Campaign guidelines', date: 'May 15, 2026', severity: 'Medium', desc: 'Review the MHA safe internet routing checklist for home and business configurations.' },
  { id: 4, title: 'Warning: Fake e-challan portals operating on spoofed domains', date: 'April 30, 2026', severity: 'Critical', desc: 'Confirm URL domain before inputting card coordinates or OTP keys.' }
];

const CIRCULARS = [
  { title: 'Information Technology Act (Section 66D) Reference.pdf', size: '1.2 MB' },
  { title: 'MHA Cyber Crime Investigation SOP (Volume 4).pdf', size: '3.4 MB' },
  { title: 'Indian Penal Code Sections 419 & 420 Reference guidelines.pdf', size: '840 KB' },
  { title: 'Anonymous Whistleblower Protection Charter, 2026.pdf', size: '1.8 MB' }
];

export default function App() {
  // Navigation tabs within Citizen view
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'fir' | 'track' | 'registry'

  // Accordion / Collapsible section states for forms
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isComplainantOpen, setIsComplainantOpen] = useState(false);
  const [isGovIdOpen, setIsGovIdOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(true);

  // Search State Nodal Officers
  const [selectedState, setSelectedState] = useState('All');

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
    <div className="w-full space-y-8">
      
      {/* 3-Column Grid Layout: Left Column (Helplines & Nodal Officers), Center Column (Forms & Main Action Frame), Right Column (Bulletins, Acts & FAQs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Helplines, Nodal Officers & Security Seals */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Official Helplines */}
          <div className="bg-white border-t-4 border-t-[#ff9933] border-x border-b border-slate-200 p-5 rounded-2xl space-y-4 shadow-md relative overflow-hidden text-slate-800">
            <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 pointer-events-none">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
                alt=""
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#ff9933]" />
              <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">
                Emergency Helplines
              </h3>
            </div>
            <p className="text-[10px] text-slate-550">
              For immediate physical assistance or threat to life, contact emergency dispatchers immediately:
            </p>
            <div className="space-y-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-[#ff9933]/10 border border-slate-200 hover:border-[#ff9933]/30 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#ff9933] transition duration-200"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  National Emergency
                </span>
                <span className="font-mono text-[#ff9933] font-bold">112</span>
              </a>
              <a
                href="tel:1930"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-blue-50/10 border border-slate-200 hover:border-blue-500/30 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 transition duration-200"
              >
                <span>Cyber Crime</span>
                <span className="font-mono text-blue-600 font-bold">1930</span>
              </a>
              <a
                href="tel:1091"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-[#138808]/10 border border-slate-200 hover:border-[#138808]/30 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#138808] transition duration-200"
              >
                <span>Women Helpline</span>
                <span className="font-mono text-[#138808] font-bold">1091</span>
              </a>
              <a
                href="tel:1098"
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-purple-500/15 border border-slate-200 hover:border-purple-500/30 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-650 transition duration-200"
              >
                <span>Child Helpline</span>
                <span className="font-mono text-purple-650 font-bold">1098</span>
              </a>
            </div>
          </div>

          {/* Searchable State Nodal Officers Directory */}
          <div className="bg-white border-t-4 border-t-[#138808] border-x border-b border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#138808]" />
              <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">
                State Nodal Directory
              </h3>
            </div>
            <p className="text-[10px] text-slate-500">
              Locate official cyber crime cell investigators and contact details by selecting your state:
            </p>
            <div className="space-y-3">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-700 outline-none focus:border-[#138808]/50"
              >
                <option value="All">All States / UTs</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Rajasthan">Rajasthan</option>
              </select>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {NODAL_OFFICERS.filter(off => selectedState === 'All' || off.state === selectedState).map((off, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px] space-y-0.5">
                    <div className="font-bold text-[#1b365d]">{off.state} Node</div>
                    <div className="text-slate-750 font-semibold">{off.officer}</div>
                    <div className="text-slate-500">Email: {off.email}</div>
                    <div className="text-[#138808] font-bold">Tel: {off.contact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-slate-800">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#138808]" />
              <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">
                Security Protocols
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/25 text-[#138808] rounded-lg mt-0.5">
                  <EyeOff className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Zero-Trace Routing</h4>
                  <p className="text-[9px] text-slate-550 leading-normal mt-0.5">
                    Your IP address and transmission logs are stripped at the proxy level before saving.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-650 rounded-lg mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Identity Protection</h4>
                  <p className="text-[9px] text-slate-550 leading-normal mt-0.5">
                    Anonymous reports scrub personal names. e-FIR complainant details are strictly encrypted.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-purple-500/10 border border-purple-550/25 text-purple-600 rounded-lg mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Secure Cloud Vault</h4>
                  <p className="text-[9px] text-slate-550 leading-normal mt-0.5">
                    Hosted in a high-grade PostgreSQL cluster with end-to-end TLS database validation.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Center Column: Portal Statistics, Tab capsule controller & Action forms */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Live Portal Statistics Counter Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Alerts Sent</div>
              <div className="text-lg font-extrabold text-[#ff9933] mt-1">1,245</div>
              <div className="text-[8px] text-slate-400 mt-0.5">Dispatched Today</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Nodal Officers</div>
              <div className="text-lg font-extrabold text-[#1b365d] mt-1">840+</div>
              <div className="text-[8px] text-[#138808] font-bold mt-0.5">Active on Nodes</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Resolved Cases</div>
              <div className="text-lg font-extrabold text-[#138808] mt-1">14,208</div>
              <div className="text-[8px] text-slate-400 mt-0.5">This Quarter</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Network Integrity</div>
              <div className="text-lg font-extrabold text-emerald-600 mt-1">99.98%</div>
              <div className="text-[8px] text-emerald-650 font-bold mt-0.5">Secured & Active</div>
            </div>
          </div>

          {/* Inner Citizen Tabs switcher - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'report'
                  ? 'bg-[#1b365d] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Anonymous
            </button>
            <button
              onClick={() => setActiveTab('fir')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'fir'
                  ? 'bg-[#ff9933] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              File e-FIR
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'track'
                  ? 'bg-[#138808] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Track Case
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                activeTab === 'registry'
                  ? 'bg-[#1b365d] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-md text-slate-800">
                    <div className="w-16 h-16 bg-[#138808]/10 rounded-full border border-[#138808]/30 flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle className="w-10 h-10 text-[#138808]" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-[#1b365d]">Anonymous Report Registered</h2>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Your incident has been securely logged without identifying information.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-sm mx-auto">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Secure Case File Key</div>
                      <div className="text-xl font-mono text-[#ff9933] font-bold mt-1">#SPK-{reportSuccess.id}</div>
                    </div>
                    <button
                      onClick={() => setReportSuccess(null)}
                      className="bg-[#138808] hover:bg-[#0f6c06] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                    >
                      File Another Incident
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl space-y-4 shadow-md text-slate-800 animate-fade-in">
                    <div className="space-y-1 pb-2">
                      <h3 className="text-sm font-extrabold text-[#1b365d] uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#ff9933]" />
                        Anonymous Incident Intelligence Triage
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        This route scrubs your personal name, contact details, and location maps. Strictly for general public safety feeds.
                      </p>
                    </div>

                    {/* Section 1: Classification & Category (Collapsible) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <Flame className="w-4 h-4 text-[#ff9933]" />
                          1. Incident Classification & Category
                        </div>
                        {isCategoryOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>
                      
                      {isCategoryOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
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
                                      ? 'bg-[#ff9933]/10 border-[#ff9933]/50 shadow-sm' 
                                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                                  }`}
                                >
                                  <div className={`p-2 rounded-lg ${cat.bg} ${cat.color} border ${cat.border} mb-3 group-hover:scale-110 transition duration-200`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 mb-0.5">{cat.label}</div>
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{cat.desc}</div>
                                  {isSelected && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#ff9933] animate-pulse"></span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Incident Details (Title & Description) (Collapsible) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <FileText className="w-4 h-4 text-[#ff9933]" />
                          2. Incident Narrative & Details
                        </div>
                        {isDescriptionOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isDescriptionOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold">Incident Title</label>
                            <input
                              type="text"
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#1b365d]/50 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                              placeholder="Brief summary (e.g. Theft in Sector 4 Market)"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] text-slate-500 font-semibold">Detailed Description</label>
                              <button
                                type="button"
                                onClick={toggleRecording}
                                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition duration-200 ${
                                  isRecording 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {isRecording ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-red-500" />}
                                {isRecording ? 'Listening...' : 'Dictate Speech'}
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#1b365d]/50 rounded-xl px-4 py-3 text-xs text-slate-855 placeholder-slate-400 outline-none transition resize-none font-sans"
                              placeholder="Provide a thorough explanation. What occurred? When? Mention vehicle numbers or physical markings if available."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Evidence media uploader (Collapsible, closed by default) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <UploadCloud className="w-4 h-4 text-[#ff9933]" />
                          3. Evidence Files Upload {evidenceUrl && <span className="text-[#138808] text-[9px] lowercase font-bold">(uploaded)</span>}
                        </div>
                        {isEvidenceOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isEvidenceOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-3 bg-white">
                          <p className="text-[10px] text-slate-500">Provide photos, screenshots, videos or documents backing up the incident statement. Encrypted inside secure cloud buckets.</p>
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
                                ? 'border-emerald-500/35 bg-emerald-500/5' 
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                            }`}
                          >
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-slate-350 border-t-[#ff9933] rounded-full animate-spin"></div>
                                <span className="text-[10px] text-slate-500">Encrypting & uploading...</span>
                              </div>
                            ) : uploadSuccess ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="w-8 h-8 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-[#138808]">
                                  <Check className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-[#138808]">Evidence Uploaded Successfully</span>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-800">Drag & drop or browse files</span>
                                <span className="text-[9px] text-slate-500">Images, videos, or PDFs up to 50MB</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 4: Geotagging & Map (Collapsible, closed by default) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsMapOpen(!isMapOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <MapPin className="w-4 h-4 text-[#ff9933]" />
                          4. Incident Location Tagging {includeLocation && <span className="text-[#138808] text-[9px] lowercase font-bold">(active)</span>}
                        </div>
                        {isMapOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isMapOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-3 bg-white">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-550">Attach precise GPS coordinates of where the incident took place. Click on the map to tag the exact coordinates.</span>
                            <button
                              type="button"
                              onClick={handleGetLocation}
                              className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border transition duration-200 flex-shrink-0 ${
                                includeLocation 
                                  ? 'bg-[#ff9933]/15 border-[#ff9933]/30 text-[#e68a2e]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              {includeLocation ? 'Coordinates Attached' : 'Use My GPS'}
                            </button>
                          </div>
                          {includeLocation && (
                            <div className="space-y-2">
                              <div className="h-[200px] rounded-xl overflow-hidden border border-slate-200">
                                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                  <Marker position={coordinates} />
                                  <MapEvents />
                                </MapContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 5: AI Redaction Toggle (Collapsible) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsConsentOpen(!isConsentOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <ShieldCheck className="w-4 h-4 text-[#ff9933]" />
                          5. Privacy Redaction & Submission
                        </div>
                        {isConsentOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isConsentOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                                <ShieldAlert className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">Enable AI Privacy Redaction</div>
                                <div className="text-[9px] text-slate-550 mt-0.5">Scrub names, phone numbers, and addresses dynamically.</div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#ff9933] border-slate-350 bg-white rounded focus:ring-[#ff9933]"
                              checked={enableRedact}
                              onChange={() => setEnableRedact(!enableRedact)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#ff9933] hover:bg-[#e68a2e] text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          PII Redaction & Submitting Incident...
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
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-md text-slate-800">
                    <div className="w-16 h-16 bg-[#138808]/10 rounded-full border border-[#138808]/30 flex items-center justify-center mx-auto">
                      <FileCheck className="w-10 h-10 text-[#138808]" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-[#1b365d]">Official e-FIR Filed Successfully</h2>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Your legal complainant verification has been securely registered in the Home Ministry data vault.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-sm mx-auto">
                      <div className="text-[10px] uppercase font-bold text-slate-550">Official e-FIR ID</div>
                      <div className="text-xl font-mono text-[#ff9933] font-bold mt-1">#FIR-{reportSuccess.id}</div>
                    </div>
                    <button
                      onClick={() => setReportSuccess(null)}
                      className="bg-[#138808] hover:bg-[#0f6c06] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                    >
                      File Another e-FIR
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl space-y-4 shadow-md text-slate-800 animate-fade-in">
                    <div className="space-y-1 pb-2">
                      <h3 className="text-sm font-extrabold text-[#1b365d] uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#ff9933]" />
                        Official Complainant Verified e-FIR Filing
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        File an official First Information Report. Requires Government ID verification. Complainant details are held under strict security.
                      </p>
                    </div>

                    {/* Section 1: Complainant Legal Credentials (Collapsible, starts closed) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsComplainantOpen(!isComplainantOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <User className="w-4 h-4 text-[#ff9933]" />
                          1. Complainant Personal Credentials {complainantName && <span className="text-[#138808] text-[9px] lowercase font-bold">(filled)</span>}
                        </div>
                        {isComplainantOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isComplainantOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Full Legal Name</label>
                              <input
                                type="text"
                                required
                                value={complainantName}
                                onChange={(e) => setComplainantName(e.target.value)}
                                placeholder="e.g. Rajesh Kumar"
                                className="w-full bg-slate-55 border border-slate-200 focus:border-[#ff9933]/50 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Contact Number / Email</label>
                              <input
                                type="text"
                                required
                                value={complainantContact}
                                onChange={(e) => setComplainantContact(e.target.value)}
                                placeholder="e.g. +91 98765 43210"
                                className="w-full bg-slate-55 border border-slate-200 focus:border-[#ff9933]/50 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Government ID Verification (Collapsible, starts closed) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsGovIdOpen(!isGovIdOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <UploadCloud className="w-4 h-4 text-[#ff9933]" />
                          2. Government ID Document Verification {idUploadSuccess && <span className="text-[#138808] text-[9px] lowercase font-bold">(uploaded)</span>}
                        </div>
                        {isGovIdOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isGovIdOpen && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div className="sm:col-span-1 space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Govt ID Type</label>
                              <select
                                value={idType}
                                onChange={(e) => setIdType(e.target.value)}
                                className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-705 outline-none focus:border-[#ff9933]/50"
                              >
                                <option value="Aadhaar Card">Aadhaar Card</option>
                                <option value="Passport">Passport</option>
                                <option value="PAN Card">PAN Card</option>
                                <option value="Voter ID">Voter ID</option>
                              </select>
                            </div>
                            
                            <div className="sm:col-span-2 space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Upload Govt ID Copy (PDF / Image)</label>
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
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-[#138808]' 
                                    : 'bg-slate-55 border-slate-200 text-slate-650 hover:bg-slate-50'
                                }`}
                              >
                                {isUploadingId ? (
                                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#ff9933] rounded-full animate-spin"></div>
                                ) : (
                                  <UploadCloud className="w-4 h-4 text-[#ff9933]" />
                                )}
                                {isUploadingId ? 'Uploading ID Document...' : idUploadSuccess ? 'Govt ID Document Verified' : 'Browse ID file'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Incident Category (Collapsible) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <Flame className="w-4 h-4 text-[#ff9933]" />
                          3. Incident Category
                        </div>
                        {isCategoryOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isCategoryOpen && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Select Classification</label>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 outline-none focus:border-[#ff9933]/50"
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 4: Incident details (Title & description) (Collapsible) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <FileText className="w-4 h-4 text-[#ff9933]" />
                          4. Incident Narrative Details
                        </div>
                        {isDescriptionOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isDescriptionOpen && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold">Incident Title</label>
                            <input
                              type="text"
                              required
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Brief legal summary of complaint"
                              className="w-full bg-slate-55 border border-slate-200 focus:border-[#ff9933]/50 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold">Legal Incident Statement (Unaltered Description)</label>
                            <textarea
                              rows={4}
                              required
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Please detail the incident precisely. Mention dates, times, names of suspects if known, and specific order of events."
                              className="w-full bg-slate-55 border border-slate-200 focus:border-[#ff9933]/50 rounded-xl px-4 py-3 text-xs text-slate-855 placeholder-slate-400 outline-none transition resize-none font-sans"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 5: Evidentiary files upload (Collapsible, starts closed) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <UploadCloud className="w-4 h-4 text-[#ff9933]" />
                          5. Attach Evidentiary Files {evidenceUrl && <span className="text-[#138808] text-[9px] lowercase font-bold">(uploaded)</span>}
                        </div>
                        {isEvidenceOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isEvidenceOpen && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                          <p className="text-[10px] text-slate-500">Provide photos, screenshots, videos or documents backing up the incident statement. Encrypted inside secure cloud buckets.</p>
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
                                ? 'border-emerald-500/35 bg-emerald-500/5' 
                                : 'border-slate-200 bg-slate-55 hover:bg-slate-100/60'
                            }`}
                          >
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-slate-350 border-t-[#ff9933] rounded-full animate-spin"></div>
                                <span className="text-[10px] text-slate-500">Uploading secure payload...</span>
                              </div>
                            ) : uploadSuccess ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="w-8 h-8 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-[#138808]">
                                  <Check className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-[#138808]">Evidence Uploaded successfully</span>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-800">Drag & drop or browse files</span>
                                <span className="text-[9px] text-slate-500">Attach photos, videos, or legal PDFs</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 6: Geotag Location Map (Collapsible, starts closed) */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsMapOpen(!isMapOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <MapPin className="w-4 h-4 text-[#ff9933]" />
                          6. Incident Location Tagging {includeLocation && <span className="text-[#138808] text-[9px] lowercase font-bold">(active)</span>}
                        </div>
                        {isMapOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isMapOpen && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-550">Attach coordinates to register local municipal cyber jurisdiction. Click on the map to pin a location.</span>
                            <button
                              type="button"
                              onClick={handleGetLocation}
                              className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border transition duration-200 flex-shrink-0 ${
                                includeLocation 
                                  ? 'bg-[#ff9933]/15 border-[#ff9933]/30 text-[#e68a2e]' 
                                  : 'bg-slate-55 border-slate-200 text-slate-655 hover:bg-slate-100'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              {includeLocation ? 'Coordinates Attached' : 'Attach Coordinates'}
                            </button>
                          </div>
                          {includeLocation && (
                            <div className="h-[200px] rounded-xl overflow-hidden border border-slate-200">
                              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={coordinates} />
                                <MapEvents />
                              </MapContainer>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 7: Redaction and Submission Consent */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsConsentOpen(!isConsentOpen)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100/60 transition text-left"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1b365d] uppercase tracking-wide">
                          <ShieldCheck className="w-4 h-4 text-[#ff9933]" />
                          7. Legal Consent & Submission
                        </div>
                        {isConsentOpen ? <ChevronUp className="w-4 h-4 text-[#1b365d]" /> : <ChevronDown className="w-4 h-4 text-[#1b365d]" />}
                      </button>

                      {isConsentOpen && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">Enable AI Privacy Redaction</div>
                                <div className="text-[9px] text-slate-550 mt-0.5">Scrub names and PII details from official logs automatically.</div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#ff9933] border-slate-350 bg-white rounded focus:ring-[#ff9933]"
                              checked={enableRedact}
                              onChange={() => setEnableRedact(!enableRedact)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#138808] hover:bg-[#0f6c06] text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow"
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
                className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl space-y-6 shadow-md text-slate-800"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#1b365d] flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#ff9933]" />
                    Incident Status & e-FIR Tracker
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input your Case Key (#SPK-xx) or e-FIR Key (#FIR-xx) below to track real-time processing status.
                  </p>
                </div>
                
                <form onSubmit={handleSearchReport} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="e.g. #SPK-12 or #FIR-7"
                      className="w-full bg-slate-55 border border-slate-205 focus:border-[#ff9933]/50 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTrackingLoading}
                    className="bg-[#1b365d] hover:bg-[#142947] text-white font-bold text-xs px-5 py-3 rounded-xl border border-[#1b365d]/20 active:scale-[0.98] transition flex items-center gap-1.5"
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
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
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
                      className="space-y-6 border-t border-slate-200 pt-6"
                    >
                      {/* Header Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Case Key</div>
                          <div className="text-base font-mono font-bold text-[#1b365d] mt-0.5">
                            {trackedReport.report_type === 'fir' ? `#FIR-${trackedReport.id}` : `#SPK-${trackedReport.id}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Classification</div>
                          <div className="text-xs font-bold mt-1 uppercase flex items-center gap-1">
                            {trackedReport.report_type === 'fir' ? (
                              <span className="text-[#ff9933]">Legal e-FIR</span>
                            ) : (
                              <span className="text-[#138808]">Anonymous Report</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">Registration Date</div>
                          <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(trackedReport.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                        </div>
                      </div>

                      {/* Visual Timeline */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#ff9933]" />
                          Investigation Status Timeline
                        </h4>
                        
                        <div className="relative pl-6 border-l border-slate-200 space-y-6">
                          {timelineSteps.map((step, idx) => {
                            const isActive = idx <= getStatusStepIndex(trackedReport.status);
                            const isCurrent = idx === getStatusStepIndex(trackedReport.status);
                            return (
                              <div key={idx} className="relative">
                                {/* Bullet Node */}
                                <span className={`absolute -left-[32px] top-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                  isActive 
                                    ? isCurrent
                                      ? 'bg-[#ff9933] border-[#ff9933] text-white shadow-[0_0_6px_rgba(255,153,51,0.5)]'
                                      : 'bg-[#138808] border-[#138808] text-white'
                                    : 'bg-white border-slate-250 text-slate-400'
                                }`}>
                                  {isActive && idx < getStatusStepIndex(trackedReport.status) ? (
                                    <Check className="w-2.5 h-2.5" />
                                  ) : (
                                    <span className="text-[8px] font-bold">{idx + 1}</span>
                                  )}
                                </span>
                                
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                      {step.label}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[8px] font-bold bg-[#ff9933]/15 text-[#ff9933] border border-[#ff9933]/25 px-1.5 py-0.5 rounded-md">
                                        Current Stage
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[10px] leading-relaxed ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Official Remarks Log */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#ff9933]" />
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Official Action Logs / remarks</h4>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed font-sans border-l border-[#ff9933]/30 pl-3 py-0.5">
                          {trackedReport.admin_remarks || 'The case file is queued for police triage. No official actions logged yet.'}
                        </div>
                      </div>

                      {/* Details Summary Preview */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Incident Preview</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <span className="text-slate-500">Title:</span>
                            <span className="text-slate-800 ml-1.5 font-semibold">{trackedReport.title}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Urgency Classification:</span>
                            <span className={`ml-1.5 font-bold ${
                              trackedReport.severity === 'High' ? 'text-red-500' : 
                              trackedReport.severity === 'Medium' ? 'text-amber-500' : 'text-[#138808]'
                            }`}>{trackedReport.severity}</span>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="text-slate-500">Description:</span>
                          <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px]">
                            {trackedReport.description}
                          </p>
                        </div>
                      </div>

                    </motion.div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3">
                      <HelpCircle className="w-8 h-8 text-slate-300" />
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
                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-md text-slate-800">
                  <h3 className="text-sm font-extrabold text-[#1b365d] uppercase flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#1b365d]" />
                    Public Case Registry & Transparency Board
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    This registry allows citizens to monitor active and pending incident statistics and official action logs. To protect witness safety and complainant privacy, confidential descriptions, coordinates, and upload documents are masked.
                  </p>
                </div>

                {/* Main registry panel with list & masked inspector */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Left Column: Filter and Tally list (2/5 size) */}
                  <div className="md:col-span-2 bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-md text-slate-800">
                    
                    {/* Tiny Category/Status Filters */}
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-200">
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Category</label>
                        <select
                          value={filterRegCategory}
                          onChange={(e) => setFilterRegCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-700 outline-none"
                        >
                          <option value="All">All Categories</option>
                          <option value="Crime & Violence">Crime & Violence</option>
                          <option value="Corruption">Corruption</option>
                          <option value="Cyber Crime">Cyber Crime</option>
                          <option value="Public Safety">Public Safety</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Status</label>
                        <select
                          value={filterRegStatus}
                          onChange={(e) => setFilterRegStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-700 outline-none"
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
                            <div key={i} className="h-16 bg-slate-50 rounded-xl"></div>
                          ))}
                        </div>
                      ) : filteredRegReports.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-[10px]">
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
                                  ? 'bg-[#ff9933]/10 border-[#ff9933]/30 text-slate-900' 
                                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60'
                              }`}
                            >
                              <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-400">
                                <span>{rep.report_type === 'fir' ? `#FIR-${rep.id}` : `#SPK-${rep.id}`}</span>
                                <span className={rep.report_type === 'fir' ? 'text-[#ff9933]' : 'text-[#138808]'}>
                                  {rep.report_type === 'fir' ? 'e-FIR' : 'Anonymous'}
                                </span>
                              </div>
                              <div className="font-bold text-slate-800 line-clamp-1">{rep.title}</div>
                              
                              <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
                                <span>{rep.category}</span>
                                <span className={`px-1.5 py-0.5 rounded border text-[8px] ${STATUS_STYLING[rep.status] || 'bg-slate-250 text-slate-700'}`}>
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
                  <div className="md:col-span-3 bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-slate-800">
                    {selectedRegistryReport ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                          <div>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Public Registry ID: {selectedRegistryReport.report_type === 'fir' ? `#FIR-${selectedRegistryReport.id}` : `#SPK-${selectedRegistryReport.id}`}
                            </span>
                            <h3 className="text-xs font-bold text-[#1b365d] mt-0.5">{selectedRegistryReport.title}</h3>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${STATUS_STYLING[selectedRegistryReport.status]}`}>
                            {selectedRegistryReport.status}
                          </span>
                        </div>

                        {/* Masked details message */}
                        <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                            <ShieldX className="w-4 h-4" />
                            Security Protection Active
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Due to witness confidentiality protocols, investigation case files are encrypted. Public access is restricted to official action logs.
                          </p>
                        </div>

                        {/* Case specifics */}
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-slate-400 font-medium block">Report Category</span>
                            <span className="text-slate-800 font-bold mt-0.5 block">{selectedRegistryReport.category}</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-slate-400 font-medium block">Urgency Classification</span>
                            <span className={`font-bold mt-0.5 block ${
                              selectedRegistryReport.severity === 'High' ? 'text-red-500' : 'text-[#138808]'
                            }`}>{selectedRegistryReport.severity}</span>
                          </div>
                        </div>

                        {/* Masked Narrative */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Incident Narrative</label>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] text-slate-400 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-slate-350" />
                            <span>🔒 Description details masked for public safety.</span>
                          </div>
                        </div>

                        {/* Masked Evidence */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Evidentiary Attachments</label>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] text-slate-400 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-slate-350" />
                            <span>🔒 Evidence file encrypted in cloud storage.</span>
                          </div>
                        </div>

                        {/* Transparent Action log */}
                        <div className="bg-[#138808]/5 p-4 rounded-xl border border-[#138808]/20 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#138808]" />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#138808]">Official Action remarks</h4>
                          </div>
                          <p className="text-[10px] text-slate-700 leading-relaxed font-sans border-l border-[#138808]/30 pl-3">
                            {selectedRegistryReport.admin_remarks || 'Incident is registered. Awaiting initial officer dispatch details.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-400 text-xs">
                        Select a report from the list to review action progress.
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
             </div>

        {/* Right Column: Advisories, Circulars & FAQs */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* MHA Security Advisories */}
          <div className="bg-white border-t-4 border-t-[#ff9933] border-x border-b border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-slate-800 relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 opacity-5 pointer-events-none">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
                alt=""
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff9933]" />
              <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">
                Advisories & Bulletins
              </h3>
            </div>
            <p className="text-[10px] text-slate-550 leading-relaxed">
              Recent safety bulletins dispatched by the Ministry of Home Affairs Cyber Division:
            </p>
            <div className="space-y-2.5">
              {ADVISORIES.map(adv => (
                <div key={adv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate-400">{adv.date}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      adv.severity === 'Critical' 
                        ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
                        : adv.severity === 'High'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    }`}>
                      {adv.severity}
                    </span>
                  </div>
                  <h4 className="text-[10px] font-bold text-[#1b365d] hover:underline cursor-pointer leading-snug">
                    {adv.title}
                  </h4>
                  <p className="text-[9px] text-slate-550 leading-relaxed font-medium">
                    {adv.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Acts & Circulars */}
          <div className="bg-white border-t-4 border-t-blue-600 border-x border-b border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">
                Acts & Official Circulars
              </h3>
            </div>
            <p className="text-[10px] text-slate-550 leading-relaxed">
              Download national standards, cyber laws, and standard operating procedures (SOPs):
            </p>
            <div className="space-y-2">
              {CIRCULARS.map((cir, idx) => (
                <a
                  key={idx}
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert(`Downloading ${cir.title}...`); }}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-50 hover:bg-blue-500/5 border border-slate-200 hover:border-blue-500/20 rounded-xl transition group text-left w-full"
                >
                  <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-[10px] font-semibold text-slate-700 group-hover:text-[#1b365d] transition truncate">
                      {cir.title}
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5 font-medium">{cir.size} • PDF Document</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Citizen FAQs (Accordion inside Sidebar) */}
          <div className="bg-white border-t-4 border-t-[#138808] border-x border-b border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-slate-800">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#138808]" />
              <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">
                Citizen FAQs
              </h3>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border-b border-slate-150 pb-2 last:border-b-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center text-left py-1.5 text-[10px] font-bold text-slate-700 hover:text-[#1b365d] transition duration-200"
                    >
                      <span className="pr-2">{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />}
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
                          <p className="text-[9px] text-slate-550 leading-relaxed pt-0.5 pb-1.5 font-medium">
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
      </div>

    </div>
  );
}

const STATUS_STYLING = {
  Submitted: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Under Investigation': 'bg-amber-50 border-amber-200 text-amber-700',
  'Action Taken': 'bg-blue-50 border-blue-200 text-blue-700',
  Resolved: 'bg-emerald-50 border-emerald-250 text-emerald-700'
};
