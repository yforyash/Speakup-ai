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
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

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
  Submitted: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  'Under Investigation': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'Action Taken': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  Resolved: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
};

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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
    fetchReports();
  }, []);

  // Update report selected values on active report toggle
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setActionStatus(report.status);
    setActionRemarks(report.admin_remarks || '');
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
    return matchCat && matchSev && matchStat;
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

  const pieData = Object.keys(severityCounts).map(key => ({
    name: key,
    value: severityCounts[key]
  })).filter(item => item.value > 0);

  // Chart Data: Category Distribution
  const categoryCounts = reports.reduce((acc, rep) => {
    acc[rep.category] = (acc[rep.category] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(categoryCounts).map(key => ({
    name: key,
    count: categoryCounts[key]
  }));

  // Geotagged reports for maps
  const geotaggedReports = reports.filter(rep => rep.latitude && rep.longitude);

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* 1. Statistics Summary Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Reports</span>
            <div className="text-2xl font-bold mt-1 text-white">{totalCases}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">High Severity</span>
            <div className="text-2xl font-bold mt-1 text-red-500">{highSevCases}</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Under Action</span>
            <div className="text-2xl font-bold mt-1 text-amber-500">{activeCases}</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Resolved Cases</span>
            <div className="text-2xl font-bold mt-1 text-emerald-500">{resolvedCases}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Visualizations and Intelligence Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Intelligence Map Picker */}
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              Geo-Intelligence Mapping
            </h3>
            <span className="text-xs text-slate-400">
              {geotaggedReports.length} Tagged Cases
            </span>
          </div>

          <div className="h-[280px] rounded-xl overflow-hidden border border-white/5 shadow-inner">
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

        {/* Charts summary panel */}
        <div className="lg:col-span-1 bg-[#111827] border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Severity Breakdown</h3>
          
          <div className="h-[220px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500">No chart data available</span>
            )}
          </div>
        </div>

      </div>

      {/* 3. Main Data Panel: Filters, List, and Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Filter & Report list (1/3 width) */}
        <div className="lg:col-span-1 bg-[#111827] border border-white/5 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              Incidents List
            </h3>
            <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400">
              {filteredReports.length} Shown
            </span>
          </div>

          {/* Filters drop downs */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
              <select
                className="w-full mt-1 bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Severity</label>
                <select
                  className="w-full mt-1 bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
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
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                <select
                  className="w-full mt-1 bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
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
                  <div key={i} className="h-20 bg-slate-900/60 rounded-xl"></div>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs mt-4 border border-dashed border-white/5 rounded-xl">
                No matching reports found.
              </div>
            ) : (
              filteredReports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => handleSelectReport(rep)}
                    className={`w-full text-left p-3.5 rounded-xl border transition duration-200 flex flex-col items-start gap-1.5 ${
                      isSelected 
                        ? 'bg-[#1e1e2d] border-red-500/30' 
                        : 'bg-slate-900/50 border-white/5 hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-full flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-white line-clamp-1 flex-1">{rep.title}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">#SPK-{rep.id}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
                        {rep.category}
                      </span>
                      <span 
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${SEVERITY_COLORS[rep.severity]}15`, color: SEVERITY_COLORS[rep.severity] }}
                      >
                        {rep.severity}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLING[rep.status] || 'bg-slate-800 text-slate-300'}`}>
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
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 p-6 rounded-3xl shadow-xl">
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
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-5 border-b border-white/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">Case File ID: #SPK-{selectedReport.id}</span>
                      {selectedReport.redacted && (
                        <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          AI Redacted
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">{selectedReport.title}</h2>
                    <p className="text-xs text-slate-400">
                      Reported on {new Date(selectedReport.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-800 text-slate-300">
                      {selectedReport.category}
                    </span>
                    <span 
                      className="text-xs px-3 py-1 rounded-full font-bold"
                      style={{ backgroundColor: `${SEVERITY_COLORS[selectedReport.severity]}15`, color: SEVERITY_COLORS[selectedReport.severity] }}
                    >
                      {selectedReport.severity} Severity
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${STATUS_STYLING[selectedReport.status] || 'bg-slate-800 text-slate-300'}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Narrative</h4>
                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-200 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-line">
                    {selectedReport.description}
                  </div>
                </div>

                {/* Geotag maps & Evidence media grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Evidence Media Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Evidence File</h4>
                    <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 h-[180px] flex items-center justify-center relative overflow-hidden">
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
                            className="flex flex-col items-center gap-2 text-blue-400 hover:text-blue-300 transition"
                          >
                            <FileText className="w-10 h-10" />
                            <span className="text-xs font-semibold underline flex items-center gap-0.5">
                              Open Attachment <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-500 text-xs">
                          <Info className="w-5 h-5 text-slate-600" />
                          <span>No evidence files attached.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Incident Geotag map */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Location Tag</h4>
                    <div className="bg-slate-950/40 border border-white/5 rounded-2xl h-[180px] overflow-hidden flex items-center justify-center">
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
                        <div className="flex flex-col items-center gap-1.5 text-slate-500 text-xs p-4 text-center">
                          <MapPin className="w-5 h-5 text-slate-600" />
                          <span>Coordinates not tagged on report.</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Admin Status/Action Updates Panel */}
                <form onSubmit={handleUpdateStatus} className="bg-slate-950/20 border border-white/5 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Law Enforcement Action Logs
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-1 space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Update Status</label>
                      <select
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition"
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
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Investigation Remarks</label>
                      <textarea
                        rows={2}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 transition resize-none"
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition duration-200 flex items-center gap-1.5"
                    >
                      {updating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving updates...
                        </>
                      ) : (
                        'Save Case Changes'
                      )}
                    </button>
                  </div>
                </form>

              </motion.div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm">
                No case file selected. Select a report from the list to inspect.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
