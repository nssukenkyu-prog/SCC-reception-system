import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';
import type { Visit } from '@reception/shared';
import './App.css';

function App() {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Sync
  useEffect(() => {
    let unsubscribe: () => void;

    // Auth then listen
    signInAnonymously(auth).then(() => {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
      const q = query(
        collection(db, 'visits'),
        where('date', '==', today),
        where('status', '==', 'active'),
        orderBy('arrivedAt', 'asc')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const visits = snapshot.docs.map(d => ({ ...d.data() } as Visit));
        setActiveVisits(visits);
        setLoading(false);
      });
    }).catch(err => console.error("Auth/Sync Error:", err));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Calc Logic
  const activeCount = activeVisits.length;

  let waitDisplay = '';
  // New Logic per user request
  if (activeCount <= 3) {
    waitDisplay = 'すぐご案内可能です';
  } else if (activeCount <= 8) {
    waitDisplay = '5〜10分以内にご案内可能';
  } else if (activeCount <= 12) {
    waitDisplay = '10〜15分以内にご案内可能';
  } else {
    waitDisplay = '15分以上';
  }

  if (loading) return <div style={{ color: 'white', padding: 50 }}>Connecting to Live System...</div>;

  return (
    <div className="monitor-container">
      <header>
        <h1>受付状況</h1>
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
              {activeCount}<span className="stat-unit">人</span>
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
        <div>SCC Reception Monitor System • Updating in Real-time</div>
      </footer>
    </div >
  );
}

export default App;
