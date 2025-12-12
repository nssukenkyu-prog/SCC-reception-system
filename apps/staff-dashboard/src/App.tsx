import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToVisits, updateVisitStatus, createProxyVisit, closeAllActiveVisits } from './services/staffService';
import type { Visit } from '@reception/shared';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [proxyName, setProxyName] = useState('');
  const [proxyId, setProxyId] = useState('');
  const [showProxyForm, setShowProxyForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const unsub = subscribeToVisits(today, (data) => setVisits(data));
      return () => unsub();
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyName || !proxyId) return;
    try {
      await createProxyVisit(proxyName, proxyId);
      setProxyName('');
      setProxyId('');
      setShowProxyForm(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCloseAll = async () => {
    if (window.confirm('本日の受付中の患者をすべて「取消」にしますか？')) {
      await closeAllActiveVisits(visits);
    }
  };

  if (!user) {
    return (
      <div className="login-container">
        <h1>Staff Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  const activeVisits = visits.filter(v => v.status === 'active');
  const completedVisits = visits.filter(v => v.status !== 'active');

  return (
    <div className="dashboard">
      <header>
        <h1>Reception Dashboard</h1>
        <div className="controls">
          <button onClick={() => setShowProxyForm(!showProxyForm)}>代行受付</button>
          <button onClick={handleCloseAll} className="danger">一括クローズ</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {showProxyForm && (
        <div className="proxy-form card">
          <h3>代行受付</h3>
          <form onSubmit={handleProxySubmit}>
            <input
              placeholder="診察券番号"
              value={proxyId}
              onChange={e => setProxyId(e.target.value)}
            />
            <input
              placeholder="氏名"
              value={proxyName}
              onChange={e => setProxyName(e.target.value)}
            />
            <button type="submit">登録</button>
          </form>
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <h3>待ち人数</h3>
          <p className="stat-value">{activeVisits.length}人</p>
        </div>
        <div className="stat-card">
          <h3>本日の来院</h3>
          <p className="stat-value">{visits.length}人</p>
        </div>
      </div>

      <div className="visit-list">
        <h2>受付中 ({activeVisits.length})</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>時間</th>
              <th>氏名</th>
              <th>診察券番号</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {activeVisits.map((v, i) => (
              <tr key={v.id} className="active-row">
                <td>{i + 1}</td>
                <td>{v.arrivedAt?.toDate ? v.arrivedAt.toDate().toLocaleTimeString() : 'Now'}</td>
                <td>{v.name}</td>
                <td>{v.patientId}</td>
                <td>
                  <button onClick={() => v.id && updateVisitStatus(v.id, 'paid')}>会計済</button>
                  <button onClick={() => v.id && updateVisitStatus(v.id, 'cancelled')} className="secondary">取消</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="visit-list history">
        <h2>完了/取消 ({completedVisits.length})</h2>
        <table>
          <thead>
            <tr>
              <th>時間</th>
              <th>氏名</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {completedVisits.map((v) => (
              <tr key={v.id} className={v.status}>
                <td>{v.arrivedAt?.toDate ? v.arrivedAt.toDate().toLocaleTimeString() : ''}</td>
                <td>{v.name}</td>
                <td>{v.status === 'paid' ? '会計済' : '取消'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
