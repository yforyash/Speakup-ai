import { useEffect, useState } from "react";

function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5055/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Reports</h2>
      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li key={report.id} style={{ marginBottom: "20px" }}>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
              <p>
                <strong>Time:</strong> {new Date(report.timestamp).toLocaleString()}
              </p>
              {report.evidenceUrl && (
                <p>
                  <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer">
                    View Evidence
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Reports;
