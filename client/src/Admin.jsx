import { useEffect, useState } from 'react';
import axios from 'axios';

function Admin() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      const res = await axios.get('http://localhost:5055/api/reports');
      setReports(res.data);
    };
    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">📂 Submitted Crime Reports</h1>
      {reports.length === 0 ? (
        <p className="text-gray-500">No reports submitted yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="border p-4 rounded-md shadow">
              <h2 className="text-xl font-semibold">{report.title}</h2>
              <p className="text-gray-700">{report.description}</p>
              {report.evidenceUrl && (
                <a
                  href={report.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline mt-2 block"
                >
                  View Evidence
                </a>
              )}
              <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(report.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;
