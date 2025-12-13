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
  // Simple logic: 15 mins per person roughly
  const estimatedWaitRaw = activeCount * 15;
  let waitDisplay = '0分';
  if (estimatedWaitRaw > 60) waitDisplay = '60分以上';
  else if (estimatedWaitRaw > 30) waitDisplay = '30〜60分';
  else if (estimatedWaitRaw > 10) waitDisplay = '10〜30分';
  else if (estimatedWaitRaw > 0) waitDisplay = '10分未満';
  else waitDisplay = '--';

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
        <div className="stats-panel" style={{ width: '100%', maxWidth: '1200px', flexDirection: 'row', gap: 60, justifyContent: 'center' }}>
          <div className="stat-box" style={{ flex: 1, height: '400px' }}>
            <div className="stat-label">キュアセンター内の人数</div>
            <div className="stat-value" style={{ fontSize: '10rem' }}>
              {activeCount}<span className="stat-unit" style={{ fontSize: '3rem' }}>人</span>
            </div>
          </div>

          <div className="stat-box wait-time" style={{ flex: 1, height: '400px' }}>
            <div className="stat-label">推定待ち時間</div>
            <div className="stat-value" style={{ fontSize: '8rem' }}>
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
