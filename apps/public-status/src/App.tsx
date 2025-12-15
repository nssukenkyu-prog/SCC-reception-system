import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // API URL
  const API_URL = "https://us-central1-sccreception-system.cloudfunctions.net/getCongestion";

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Sync (Polling)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setActiveCount(data.count);
        setLoading(false);
      } catch (e) {
        console.error("Failed to fetch status", e);
        // Retry or just keep existing state
      }
    };

    fetchStatus(); // Initial fetch
    const interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  let waitDisplay = '';
  // Logic per user request
  const count = activeCount || 0;
  if (count <= 3) {
    waitDisplay = 'すぐご案内可能です';
  } else if (count <= 8) {
    waitDisplay = '5〜10分以内にご案内可能';
  } else if (count <= 12) {
    waitDisplay = '10〜15分以内にご案内可能';
  } else {
    waitDisplay = '15分以上';
  }

  if (loading && activeCount === null) return <div style={{ color: 'white', padding: 50 }}>Connecting to Live System...</div>;

  return (
    <div className="monitor-container">
      <header>
        <h1>現在の混雑状況</h1>
        <div className="clock">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="monitor-main" style={{ justifyContent: 'center' }}>
        {/* Stats Only - Centered and Big */}
        <div className="stats-panel">
          <div className="stat-box">
            <div className="stat-label">キュアセンター内の人数</div>
            <div className="stat-value count-value">
              {count}<span className="stat-unit">人</span>
            </div>
          </div>

          <div className="stat-box wait-time">
            <div className="stat-label">推定待ち時間</div>
            <div className="stat-value wait-value">
              {waitDisplay}
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div>SCC Reception Monitor System • Updates automatically</div>
      </footer>
    </div >
  );
}

export default App;
