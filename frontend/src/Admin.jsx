import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Filter, 
  FileText, 
  MessageSquare,
  Sparkles,
  Info,
  ExternalLink,
  Lock,
  UserCheck,
  LogOut,
  AlertTriangle,
  FileCheck,
  User,
  Globe
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const SEVERITY_COLORS = {
  High: '#ef4444',   // Red
  Medium: '#f59e0b', // Amber
  Low: '#10b981'     // Emerald
};

const STATUS_STYLING = {
  Submitted: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Under Investigation': 'bg-amber-50 border-amber-200 text-amber-700',
  'Action Taken': 'bg-blue-50 border-blue-200 text-blue-700',
  Resolved: 'bg-emerald-50 border-emerald-250 text-emerald-700'
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('mha_admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterReportType, setFilterReportType] = useState('All'); // 'All' | 'anonymous' | 'fir'

  // Action Form States
  const [actionStatus, setActionStatus] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports`);
      setReports(res.data);
      if (res.data.length > 0 && !selectedReport) {
        setSelectedReport(res.data[0]);
        setActionStatus(res.data[0].status);
        setActionRemarks(res.data[0].admin_remarks || '');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated]);

  // Update report selected values on active report toggle
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setActionStatus(report.status);
    setActionRemarks(report.admin_remarks || '');
  };

  // Submit login credentials
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      sessionStorage.setItem('mha_admin_token', res.data.token);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Authentication credentials rejected.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Logout admin
  const handleLogout = () => {
    sessionStorage.removeItem('mha_admin_token');
    setIsAuthenticated(false);
    setSelectedReport(null);
    setReports([]);
  };

  // Submit report status update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    try {
      const res = await axios.patch(`${API_URL}/api/reports/${selectedReport.id}`, {
        status: actionStatus,
        admin_remarks: actionRemarks
      });
      
      // Update local reports lists
      setReports(prev => prev.map(rep => rep.id === selectedReport.id ? res.data.report : rep));
      setSelectedReport(res.data.report);
      alert('Case file updated successfully.');
    } catch (err) {
      alert('Failed to update case file: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Check file type for media preview
  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp)/i.test(url);
  };

  const isVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov|avi)/i.test(url);
  };

  // Filtering Logic
  const filteredReports = reports.filter(rep => {
    const matchCat = filterCategory === 'All' || rep.category === filterCategory;
    const matchSev = filterSeverity === 'All' || rep.severity === filterSeverity;
    const matchStat = filterStatus === 'All' || rep.status === filterStatus;
    const matchType = filterReportType === 'All' ||
                      (filterReportType === 'anonymous' && (rep.report_type === 'report' || rep.report_type === 'anonymous' || !rep.report_type)) ||
                      (filterReportType === 'fir' && rep.report_type === 'fir');
    return matchCat && matchSev && matchStat && matchType;
  });

  // Calculate Metrics
  const totalCases = reports.length;
  const highSevCases = reports.filter(rep => rep.severity === 'High').length;
  const activeCases = reports.filter(rep => ['Submitted', 'Under Investigation'].includes(rep.status)).length;
  const resolvedCases = reports.filter(rep => rep.status === 'Resolved').length;

  // Chart Data: Severity Distribution
  const severityCounts = reports.reduce((acc, rep) => {
    acc[rep.severity] = (acc[rep.severity] || 0) + 1;
    return acc;
  }, { Low: 0, Medium: 0, High: 0 });

  // Chart Data: Category Distribution
  const categoryCounts = reports.reduce((acc, rep) => {
    acc[rep.category] = (acc[rep.category] || 0) + 1;
    return acc;
  }, {});

  // Geotagged reports for maps
  const geotaggedReports = reports.filter(rep => rep.latitude && rep.longitude);

  // Render Login Page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto my-12">
        <motion.div 
          className="bg-white border-t-4 border-t-[#ff9933] border-x border-b border-slate-200 p-8 rounded-3xl shadow-2xl relative overflow-hidden text-slate-800"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Emblem & Top Bar */}
          <div className="flex flex-col items-center gap-3 text-center mb-6">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
              alt="National Emblem of India"
              className="w-16 h-16"
            />
            <div>
              <div className="text-[10px] text-[#ff9933] font-bold tracking-widest uppercase">
                गृह मंत्रालय | Ministry of Home Affairs
              </div>
              <h2 className="text-sm font-extrabold text-[#1b365d] mt-1 uppercase tracking-wide">
                Intelligence Control Center Login
              </h2>
              <div className="text-[9px] text-[#138808] font-bold mt-0.5 tracking-wider flex items-center justify-center gap-1">
                <span className="w-1 h-1 bg-[#138808] rounded-full animate-ping"></span>
                Secure Government Node (256-Bit SSL)
              </div>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-500 text-[11px] p-3 rounded-xl flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Officer Username / ID</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#ff9933]/50 rounded-xl px-4 py-3 text-xs text-slate-850 placeholder-slate-400 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Passcode coordinates</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (Secure@HomeMHA256)"
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#ff9933]/50 rounded-xl px-4 py-3 text-xs text-slate-850 placeholder-slate-400 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-2 bg-[#1b365d] hover:bg-[#142947] text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow"
            >
              {loggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Request Access Terminal
                </>
              )}
            </button>
          </form>

          {/* Secure Restricted Notice */}
          <div className="mt-6 border-t border-slate-200 pt-4 text-[9px] text-slate-500 leading-normal text-center space-y-2">
            <p className="font-semibold text-slate-600 uppercase flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              RESTRICTED ACCESS WARNING
            </p>
            <p>
              This system is restricted exclusively to authorized law enforcement officers. Unauthorized attempts to gain access, hack passcodes, or extract datasets constitute federal offenses punishable under Section 66 of the Information Technology Act, 2000.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Dashboard if authenticated
  return (
    <div className="w-full space-y-8 animate-fade-in text-slate-850">
      
      {/* Authorized Header Notice */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#138808]/5 border border-[#138808]/20 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#138808]/10 rounded-xl border border-[#138808]/25 text-[#138808]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-500">Verification Active</div>
            <div className="text-xs font-bold text-[#138808] flex items-center gap-1.5 mt-0.5">
              Secure Terminal: Officer MHA-IT-ADMIN Active
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition duration-205"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out Node
        </button>
      </div>

      {/* 1. Statistics Summary Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Reports</span>
            <div className="text-2xl font-bold mt-1 text-[#1b365d]">{totalCases}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-750">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">High Severity</span>
            <div className="text-2xl font-bold mt-1 text-red-500">{highSevCases}</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Under Action</span>
            <div className="text-2xl font-bold mt-1 text-amber-600">{activeCases}</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Resolved Cases</span>
            <div className="text-2xl font-bold mt-1 text-[#138808]">{resolvedCases}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[#138808]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Visualizations and Intelligence Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Intelligence Map Picker */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b365d] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              Geo-Intelligence Crime Hotspots Mapping
            </h3>
            <span className="text-xs text-slate-500">
              {geotaggedReports.length} Tagged Cases
            </span>
          </div>

          <div className="h-[280px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <MapContainer center={[28.6139, 77.2090]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {geotaggedReports.map((rep) => {
                const markerIcon = new L.Icon({
                  iconUrl: rep.severity === 'High' 
                    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' 
                    : rep.severity === 'Medium' 
                      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png' 
                      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                });
                return (
                  <Marker 
                    key={rep.id} 
                    position={[parseFloat(rep.latitude), parseFloat(rep.longitude)]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <div className="text-slate-900 leading-tight">
                        <div className="font-bold text-xs">{rep.title}</div>
                        <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{rep.category}</div>
                        <div className="text-[10px] font-bold mt-1 text-slate-700">Severity: {rep.severity}</div>
                        <button
                          onClick={() => handleSelectReport(rep)}
                          className="mt-2 text-[10px] text-blue-600 font-bold block hover:underline"
                        >
                          Inspect case file
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Custom SVG Charts summary panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b365d]">Severity & Category Meters</h3>
          
          {/* Custom Severity Bars */}
          <div className="space-y-3 flex-1">
            <h4 className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Severity Breakdown</h4>
            {['High', 'Medium', 'Low'].map((level) => {
              const count = severityCounts[level] || 0;
              const percent = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
              const color = level === 'High' ? 'bg-red-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{level} urgency</span>
                    <span className="font-bold text-slate-500">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <motion.div 
                      className={`h-full ${color}`} 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Category List Summary */}
          <div className="space-y-2 pt-2 border-t border-slate-200 max-h-[140px] overflow-y-auto text-slate-800">
            <h4 className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Category Tally</h4>
            {Object.keys(categoryCounts).length > 0 ? (
              Object.keys(categoryCounts).map((cat) => {
                const count = categoryCounts[cat];
                return (
                  <div key={cat} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-500 font-medium">{cat}</span>
                    <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[#1b365d] font-bold">{count} cases</span>
                  </div>
                );
              })
            ) : (
              <div className="text-[10px] text-slate-400 text-center py-2">No active categories.</div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Main Data Panel: Filters, List, and Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Filter & Report list (1/3 width) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b365d] flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-500" />
              Incidents List
            </h3>
            <span className="text-xs font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
              {filteredReports.length} Shown
            </span>
          </div>

          {/* Filters drop downs */}
          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
              <select
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#ff9933]/50"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Crime & Violence">Crime & Violence</option>
                <option value="Corruption">Corruption & Bribe</option>
                <option value="Cyber Crime">Cyber Crime</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Suspicious Activity">Suspicious Activity</option>
                <option value="Other">Other / General</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Classification Type</label>
              <select
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#ff9933]/50"
                value={filterReportType}
                onChange={(e) => setFilterReportType(e.target.value)}
              >
                <option value="All">All Classifications</option>
                <option value="anonymous">Anonymous Reports Only</option>
                <option value="fir">Verified e-FIR Files Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Severity</label>
                <select
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#ff9933]/50"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                <select
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#ff9933]/50"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Action Taken">Action Taken</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* List panel */}
          <div className="h-[400px] overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="space-y-2 animate-pulse mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-50 rounded-xl"></div>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs mt-4 border border-dashed border-slate-200 rounded-xl">
                No matching reports found.
              </div>
            ) : (
              filteredReports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => handleSelectReport(rep)}
                    className={`w-full text-left p-3.5 rounded-xl border transition duration-205 flex flex-col items-start gap-1.5 ${
                      isSelected 
                        ? 'bg-[#ff9933]/10 border-[#ff9933]/40' 
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="w-full flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">{rep.title}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">
                        {rep.report_type === 'fir' ? `#FIR-${rep.id}` : `#SPK-${rep.id}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-650">
                        {rep.report_type === 'fir' ? 'e-FIR' : 'Anonymous'}
                      </span>
                      <span 
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${SEVERITY_COLORS[rep.severity]}15`, color: SEVERITY_COLORS[rep.severity] }}
                      >
                        {rep.severity}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLING[rep.status] || 'bg-slate-250 text-slate-650'}`}>
                        {rep.status}
                      </span>
                    </div>

                    <div className="w-full flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                      <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                      {rep.latitude && <span className="flex items-center gap-0.5">📍 Tagged</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Case File Inspector (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Header detail */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-5 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Case File: {selectedReport.report_type === 'fir' ? `#FIR-${selectedReport.id}` : `#SPK-${selectedReport.id}`}
                      </span>
                      {selectedReport.redacted && (
                        <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded animate-pulse">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          AI Redacted
                        </span>
                      )}
                      {selectedReport.report_type === 'fir' && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/15 text-[#ff9933] border border-[#ff9933]/25 px-2 py-0.5 rounded">
                          <FileCheck className="w-3 h-3 text-[#ff9933]" />
                          Legal e-FIR
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[#1b365d] leading-tight">{selectedReport.title}</h2>
                    <p className="text-xs text-slate-500">
                      Reported on {new Date(selectedReport.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-650">
                      {selectedReport.category}
                    </span>
                    <span 
                      className="text-xs px-3 py-1 rounded-full font-bold"
                      style={{ backgroundColor: `${SEVERITY_COLORS[selectedReport.severity]}15`, color: SEVERITY_COLORS[selectedReport.severity] }}
                    >
                      {selectedReport.severity} Severity
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${STATUS_STYLING[selectedReport.status] || 'bg-slate-200 text-slate-650'}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>

                {/* Complainant Legal Details if e-FIR */}
                {selectedReport.report_type === 'fir' && (
                  <div className="bg-[#ff9933]/5 border border-[#ff9933]/25 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold uppercase text-[#ff9933] tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#ff9933]" />
                      Verified e-FIR Complainant Profile
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Complainant Full Name:</span>
                        <span className="text-slate-800 ml-1.5 font-bold">{selectedReport.complainant_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Contact Coordinates:</span>
                        <span className="text-slate-800 ml-1.5 font-bold font-mono">{selectedReport.complainant_contact || 'N/A'}</span>
                      </div>
                    </div>
                    {selectedReport.identity_document_url && (
                      <div className="text-xs pt-2.5 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Verified Identity Document:</span>
                        <a 
                          href={selectedReport.identity_document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-500 font-bold underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Uploaded Credentials <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Incident Narrative Statement</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-line font-mono">
                    {selectedReport.description}
                  </div>
                </div>

                {/* Geotag maps & Evidence media grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Evidence Media Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Evidence File</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-[180px] flex items-center justify-center relative overflow-hidden">
                      {selectedReport.evidence_url ? (
                        isImageFile(selectedReport.evidence_url) ? (
                          <a 
                            href={selectedReport.evidence_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group block relative w-full h-full"
                          >
                            <img 
                              src={selectedReport.evidence_url} 
                              alt="Evidence attachment" 
                              className="w-full h-full object-contain rounded-lg transition duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200 text-white font-bold text-xs gap-1">
                              <ExternalLink className="w-3.5 h-3.5" /> Full Size
                            </div>
                          </a>
                        ) : isVideoFile(selectedReport.evidence_url) ? (
                          <video 
                            src={selectedReport.evidence_url} 
                            controls 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <a 
                            href={selectedReport.evidence_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 text-blue-500 hover:text-blue-600 transition"
                          >
                            <FileText className="w-10 h-10" />
                            <span className="text-xs font-semibold underline flex items-center gap-0.5">
                              Open Attachment <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400 text-xs">
                          <Info className="w-5 h-5 text-slate-500" />
                          <span>No evidence files attached.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Incident Geotag map */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Incident Location Tag</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl h-[180px] overflow-hidden flex items-center justify-center">
                      {selectedReport.latitude && selectedReport.longitude ? (
                        <div className="w-full h-full">
                          <MapContainer 
                            center={[parseFloat(selectedReport.latitude), parseFloat(selectedReport.longitude)]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={false}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[parseFloat(selectedReport.latitude), parseFloat(selectedReport.longitude)]} />
                          </MapContainer>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400 text-xs p-4 text-center">
                          <MapPin className="w-5 h-5 text-slate-500" />
                          <span>Coordinates not tagged on report.</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Admin Status/Action Updates Panel */}
                <form onSubmit={handleUpdateStatus} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b365d] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#1b365d]" />
                    Law Enforcement Action Logs
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-1 space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Update Status</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#1b365d]/50 transition"
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value)}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Investigation">Under Investigation</option>
                        <option value="Action Taken">Action Taken</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Investigation Remarks</label>
                      <textarea
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#1b365d]/50 transition resize-none"
                        placeholder="Add updates: 'Assigned to Sector 4 unit', 'Evidence dispatched for forensics', etc."
                        value={actionRemarks}
                        onChange={(e) => setActionRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={updating}
                      className="bg-[#1b365d] hover:bg-[#142947] text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition duration-200 flex items-center gap-1.5 shadow"
                    >
                      {updating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving updates...
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          Save Case Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </motion.div>
            ) : (
              <div className="text-center py-20 text-slate-450 text-xs">
                No case file selected. Select a report from the list to inspect.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
