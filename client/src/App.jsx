import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaMicrophone,
  FaPaperPlane,
  FaRegClock,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [reports, setReports] = useState([]);
  const [redact, setRedact] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5055/api/reports")
      .then((res) => setReports(res.data))
      .catch((err) => console.error("Error fetching reports:", err));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5055/api/report", {
        title,
        description,
        evidenceUrl,
        redact,
      });

      setMessage("✅ Report submitted anonymously!");
      setTitle("");
      setDescription("");
      setEvidenceUrl("");

      const res = await axios.get("http://localhost:5055/api/reports");
      setReports(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Submission failed. Please try again.");
    }
  };

  const startVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition() || new window.SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.start();

    recognition.onresult = (event) => {
      setDescription((prev) => prev + " " + event.results[0][0].transcript);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
    };
  };

  const severityCounts = reports.reduce((acc, report) => {
    const sev = report.severity || "Unknown";
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(severityCounts).map(([sev, count]) => ({
    name: sev,
    count,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 text-gray-900">
      <header className="bg-blue-900 text-white py-4 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-4">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/59/Emblem_of_India.svg"
            alt="Govt Emblem"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-2xl font-semibold">SpeakUp AI</h1>
            <p className="text-sm opacity-80">Anonymous Crime Reporting Portal</p>
          </div>
        </div>
      </header>

      <section className="bg-white py-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.h2
            className="text-3xl font-bold text-blue-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaShieldAlt className="inline mr-2" />
            Report Fearlessly, Stay Anonymous
          </motion.h2>
          <p className="mt-2 text-gray-600">
            Submit any suspicious, criminal, or unethical activity securely to the authorities.
          </p>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 mt-10">
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-lg p-6 space-y-5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
            <FaMicrophone /> Submit Anonymous Report
          </h3>

          <input
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Title of the incident"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            placeholder="Describe what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <button
            type="button"
            className="text-sm text-blue-600 underline hover:text-blue-800 transition"
            onClick={startVoiceInput}
          >
            🎤 Speak Description
          </button>

          <input
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Evidence URL (image/video, optional)"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="redact"
              checked={redact}
              onChange={() => setRedact(!redact)}
            />
            <label htmlFor="redact" className="text-sm text-gray-700">
              🤖 Enable AI Redaction
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-3 rounded font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <FaPaperPlane /> Submit Anonymously
          </button>

          {message && (
            <p className="text-center font-medium text-green-600">{message}</p>
          )}

          {location && (
            <div className="mt-4">
              <p className="text-sm text-gray-700">
                📍 Approx. Location Captured:<br />
                Lat: {location.lat}, Lng: {location.lng}
              </p>
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=400x200&markers=color:red%7C${location.lat},${location.lng}&key=YOUR_GOOGLE_MAPS_API_KEY`}
                alt="Map Preview"
                className="mt-2 rounded shadow-md"
              />
            </div>
          )}
        </motion.form>
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-14 mb-10">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">📋 Submitted Reports</h2>
        {reports.length === 0 ? (
          <p className="text-gray-500">No reports yet.</p>
        ) : (
          <motion.ul className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {reports.map((report) => (
              <li key={report.id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold text-blue-800">{report.title}</h3>
                <p className="mt-1 text-gray-700">{report.description}</p>
                {report.evidenceUrl && (
                  <a
                    href={report.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline mt-2 inline-block"
                  >
                    📎 View Evidence
                  </a>
                )}
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <FaRegClock /> {new Date(report.timestamp).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </motion.ul>
        )}
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-20">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">📊 Severity Analysis</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No data available yet.</p>
        )}
      </section>

      <footer className="bg-blue-900 text-white py-4 text-center text-sm mt-10">
        <p>© 2025 SpeakUp AI. Built for secure anonymous reporting. Not a real government portal.</p>
      </footer>
    </div>
  );
}

export default App;
