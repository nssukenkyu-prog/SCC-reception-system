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
        <h1>Reception Status</h1>
        <div className="clock">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="monitor-main">
        {/* Left: Stats */}
        <div className="stats-panel">
          <div className="stat-box">
            <div className="stat-label">現在の待ち人数</div>
            <div className="stat-value">
              {activeCount}<span className="stat-unit">人</span>
            </div>
          </div>

          <div className="stat-box wait-time">
            <div className="stat-label">推定待ち時間</div>
            <div className="stat-value" style={{ fontSize: '5rem' }}>
              {waitDisplay}
            </div>
          </div>
        </div>

        {/* Right: Queue Visual */}
        <div className="list-panel">
          <div className="list-header">Calling List</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeVisits.slice(0, 5).map((v, i) => (
              <div key={i} className="status-row active">
                <span style={{ fontWeight: 'bold' }}>NO. {i + 1}</span>
                <span>...{v.patientId?.slice(-4) ?? '****'}</span>
                <span style={{ fontSize: '1rem', color: '#94a3b8' }}>
                  {v.arrivedAt?.toDate ? v.arrivedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
            {activeVisits.length > 5 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 20 }}>
                + 他 {activeVisits.length - 5} 人
              </div>
            )}
            {activeVisits.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: '1.5rem' }}>
                お待ちの方はいません
              </div>
            )}
          </div>
        </div>
      </div>

      <footer>
        <div>SCC Reception Monitor System • Updating in Real-time</div>
      </footer>
    </div>
  );
}

export default App;
