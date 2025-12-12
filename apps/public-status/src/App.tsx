import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { PublicStatus } from '@reception/shared';
import './App.css';

function App() {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'publicStatus', 'today'), (doc) => {
      if (doc.exists()) {
        setStatus(doc.data() as PublicStatus);
      } else {
        setStatus({ activeCount: 0, estimatedWaitMinutes: 0, updatedAt: null });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  const waitTime = status?.estimatedWaitMinutes || 0;
  let waitTimeDisplay = '0分';
  if (waitTime > 60) waitTimeDisplay = '60分以上';
  else if (waitTime > 30) waitTimeDisplay = '30〜60分';
  else if (waitTime > 10) waitTimeDisplay = '10〜30分';
  else waitTimeDisplay = '10分未満';

  return (
    <div className="container">
      <h1>現在の混雑状況</h1>

      <div className="card">
        <h2>待ち人数</h2>
        <div className="value">{status?.activeCount || 0} <span className="unit">人</span></div>
      </div>

      <div className="card">
        <h2>推定待ち時間</h2>
        <div className="value time">{waitTimeDisplay}</div>
        <p className="note">※あくまで目安です。状況により前後します。</p>
      </div>

      <div className="footer">
        最終更新: {status?.updatedAt?.toDate ? status.updatedAt.toDate().toLocaleTimeString() : '---'}
      </div>
    </div>
  );
}

export default App;
