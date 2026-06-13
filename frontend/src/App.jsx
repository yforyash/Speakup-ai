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
  Check
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

export default function App() {
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

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      
      {/* Left panel: Info */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-red-500" />
            100% Anonymous
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            SpeakUp does not track your IP address, browser headers, or profile information. Reports are stored securely and encrypted.
          </p>
        </div>

        <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            AI Protection
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI Redaction automatically strips out personal names, emails, phone numbers, and addresses from your description to protect your identity.
          </p>
        </div>

        <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl text-xs text-slate-500 text-center">
          For absolute safety, do not upload files that contain personal metadata or metadata identifying you.
        </div>
      </div>

      {/* Center/Right panel: Main Form */}
      <div className="md:col-span-2">
        <AnimatePresence mode="wait">
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
                <h2 className="text-2xl font-bold text-white">Report Submitted Fearlessly</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Your report has been securely registered in the network and routed to appropriate law-enforcement personnel.
                </p>
              </div>

              <div className="bg-slate-900 border border-white/5 p-4 rounded-xl max-w-sm mx-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400">Secure Report ID</div>
                <div className="text-xl font-mono text-emerald-400 font-bold mt-1">#SPK-{reportSuccess.id || 'N/A'}</div>
              </div>

              <button
                onClick={() => setReportSuccess(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition duration-200"
              >
                Submit Another Incident
              </button>
            </motion.div>
          ) : (
            <motion.form 
              onSubmit={handleFormSubmit}
              className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Step 1: Category */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">1. Incident Category</h3>
                <div className="grid grid-cols-2 gap-3">
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">2. Incident Details</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Incident Title</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-white/5 focus:border-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                    placeholder="Brief summary (e.g. Theft in Sector 4 Market)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">Detailed Description</label>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition duration-200 ${
                        isRecording 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse-glow' 
                          : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-red-400" />}
                      {isRecording ? 'Listening...' : 'Speak/Dictate'}
                    </button>
                  </div>
                  
                  <textarea
                    rows={5}
                    className="w-full bg-slate-900 border border-white/5 focus:border-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition resize-none"
                    placeholder="Please explain in detail. What did you see? When did this occur? Mention vehicle license numbers or specific physical markings, if visible."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Step 3: Evidence Upload */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Upload Evidence (Optional)</h3>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,application/pdf"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                    uploadSuccess 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : 'border-white/10 bg-slate-900 hover:bg-[#151d30] hover:border-white/20'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400">Uploading secure payload...</span>
                    </div>
                  ) : uploadSuccess ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Evidence Uploaded successfully</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{evidenceUrl}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                      <span className="text-xs font-bold text-white">Drag & drop or browse files</span>
                      <span className="text-[10px] text-slate-400">Images, videos, or PDFs up to 50MB</span>
                    </>
                  )}
                </div>
              </div>

              {/* Step 4: Geotag Location */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">4. Incident Location (Optional)</h3>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className={`flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition duration-200 ${
                      includeLocation 
                        ? 'bg-red-500/15 border-red-500/30 text-red-400' 
                        : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {includeLocation ? 'Location Captured' : 'Attach Coordinates'}
                  </button>
                </div>

                {includeLocation && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400">
                      📍 Lat: <span className="font-semibold text-white">{coordinates[0].toFixed(5)}</span>, Lng: <span className="font-semibold text-white">{coordinates[1].toFixed(5)}</span>. Click the map to adjust location:
                    </p>
                    <div className="h-[220px] rounded-xl overflow-hidden border border-white/5 shadow-inner">
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
                    <ShieldAlert className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Enable AI Privacy Redaction</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Scrub personal names, phone numbers, and emails automatically.</div>
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
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Encrypting & Sending...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    Submit Anonymous Report
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
