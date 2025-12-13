import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToVisits, updateVisitStatus, createProxyVisit, closeAllActiveVisits, updatePatientName, importPatients } from './services/staffService';
import type { Visit } from '@reception/shared';
import { VisitRow } from './components/VisitRow';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlus, LogOut, Upload, XCircle, Activity, Users } from 'lucide-react';
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
        <motion.div
          className="login-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '16px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity color="white" size={32} />
            </div>
          </div>
          <h2>Reception Command</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="オペレーターID"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="アクセスキー"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <motion.button
              type="submit"
              className="login-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              セッション開始
            </motion.button>
          </form>
          {errorMsg && <p style={{ color: '#f472b6', marginTop: 20 }}>{errorMsg}</p>}
        </motion.div>
      </div>
    );
  }

  const activeVisits = visits.filter(v => v.status === 'active');
  const completedVisits = visits.filter(v => v.status !== 'active');

  return (
    <div className="dashboard">
      <header>
        <h1>
          <Activity size={28} style={{ marginRight: 10, color: '#38bdf8' }} />
          SCC Reception <span style={{ opacity: 0.4, fontWeight: 400, marginLeft: 10 }}>Live Command</span>
        </h1>
        <div className="controls" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowImportModal(true)} className="icon-btn-large" title="CSV一括登録">
            <Upload size={22} />
          </button>
          <button onClick={() => setShowProxyForm(!showProxyForm)} className="icon-btn-large" title="代行受付">
            <UserPlus size={22} />
          </button>
          <button onClick={handleCloseAll} className="icon-btn-large danger" title="全件締め処理">
            <XCircle size={22} />
          </button>
          <button onClick={handleLogout} className="icon-btn-large" title="ログアウト">
            <LogOut size={22} />
          </button>
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

      <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-card active">
          <h3>待ち人数 (Queue)</h3>
          <p className="stat-value">{activeVisits.length}</p>
        </div>
        <div className="stat-card">
          <h3>本日の総来院数 (Total)</h3>
          <p className="stat-value">{visits.length}</p>
        </div>
      </div>

      <div className="visit-list-container">
        <h2>受付中 (Active Patients)</h2>
        <div className="visit-list-header" style={{ display: 'grid', gridTemplateColumns: '60px 140px 1fr 100px auto', gap: '20px', paddingBottom: 10 }}>
          <div style={{ textAlign: 'center' }}>No.</div>
          <div style={{ textAlign: 'center' }}>診察券</div>
          <div>氏名</div>
          <div style={{ textAlign: 'right' }}>受付時間</div>
          <div></div>
        </div>

        <div className="visit-list-body">
          <AnimatePresence>
            {activeVisits.map((v, i) => (
              <VisitRow
                key={v.id}
                visit={v}
                index={i}
                onEdit={openEditModal}
                onComplete={(id) => updateVisitStatus(id, 'paid')}
                onCancel={(id) => updateVisitStatus(id, 'cancelled')}
              />
            ))}
          </AnimatePresence>
          {activeVisits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>
              <Users size={48} style={{ marginBottom: 10 }} />
              <div>現在の待ち人数はいません</div>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {completedVisits.length > 0 && (
        <div className="visit-list history">
          <h3>完了・取消履歴 ({completedVisits.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>受付時間</th>
                  <th>氏名</th>
                  <th>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {completedVisits.map((v) => (
                  <tr key={v.id}>
                    <td>{v.arrivedAt?.toDate ? v.arrivedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    <td>{v.name}</td>
                    <td>
                      <span className={`status-badge ${v.status === 'paid' ? 'status-paid' : 'status-cancelled'}`}>
                        {v.status === 'paid' ? 'PAID' : 'CANCELLED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div >
  );
}

export default App;
