import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToVisits, updateVisitStatus, createProxyVisit, closeAllActiveVisits, updatePatientName, importPatients } from './services/staffService';
import type { Visit } from '@reception/shared';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [proxyName, setProxyName] = useState('');
  const [proxyId, setProxyId] = useState('');
  const [showProxyForm, setShowProxyForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<{ id: string, name: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
      console.log("Subscribing to visits for:", today);
      const unsub = subscribeToVisits(today,
        (data) => {
          setVisits(data);
          setErrorMsg('');
        },
        (err) => setErrorMsg(err.message)
      );
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

  const openEditModal = (patientId: string, currentName: string) => {
    setEditingPatient({ id: patientId, name: currentName });
    setNewName(currentName);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient || !newName) return;
    try {
      await updatePatientName(editingPatient.id, newName);
      setEditingPatient(null);
      setNewName('');
    } catch (error: any) {
      alert('更新に失敗しました: ' + error.message);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText) return;
    try {
      await importPatients(csvText);
      alert('インポートが完了しました');
      setShowImportModal(false);
      setCsvText('');
    } catch (error: any) {
      alert('インポート失敗: ' + error.message);
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
          <button onClick={() => setShowImportModal(true)} className="secondary">一括登録</button>
          <button onClick={() => setShowProxyForm(!showProxyForm)}>代行受付</button>
          <button onClick={handleCloseAll} className="danger">一括クローズ</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {errorMsg && (
        <div className="error-banner" style={{ background: '#ffebee', color: '#c62828', padding: '1rem', margin: '1rem' }}>
          ⚠️ エラー: {errorMsg}
        </div>
      )}

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

      {editingPatient && (
        <div className="modal-overlay">
          <div className="modal card">
            <h3>氏名変更</h3>
            <p>診察券番号: {editingPatient.id}</p>
            <form onSubmit={handleUpdateName}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="新しい氏名"
                autoFocus
              />
              <div className="modal-actions">
                <button type="submit">保存</button>
                <button type="button" onClick={() => setEditingPatient(null)} className="secondary">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {
        showImportModal && (
          <div className="modal-overlay">
            <div className="modal card" style={{ maxWidth: '600px' }}>
              <h3>患者一括登録 (CSV)</h3>
              <p>形式: 診察券番号, 氏名 (1行に1件)</p>
              <form onSubmit={handleImport}>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder="1001, 山田 太郎&#13;&#10;1002, 鈴木 花子"
                  rows={10}
                  style={{ width: '100%', marginBottom: '1rem', fontFamily: 'monospace' }}
                />
                <div className="modal-actions">
                  <button type="submit">インポート実行</button>
                  <button type="button" onClick={() => setShowImportModal(false)} className="secondary">キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

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
                <td>
                  {v.name}
                  <button className="icon-btn" onClick={() => v.patientId && openEditModal(v.patientId, v.name)}>✎</button>
                </td>
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
    </div >
  );
}

export default App;
