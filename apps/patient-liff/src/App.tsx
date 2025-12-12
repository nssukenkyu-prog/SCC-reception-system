import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { initLiff } from './liff';
import { getPatientByLineId, linkPatient, createVisit } from './services/patientService';
import type { Patient } from '@reception/shared';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputPatientId, setInputPatientId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth);
        const profile = await initLiff();
        setUser(profile);
        if (profile?.userId) {
          const p = await getPatientByLineId(profile.userId);
          setPatient(p);
        }
      } catch (e) {
        console.error(e);
        setError('LIFF initialization failed');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLink = async () => {
    if (!user?.userId || !inputPatientId) return;
    setRegistering(true);
    setError(null);
    try {
      const p = await linkPatient(inputPatientId, user.userId);
      setPatient(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    if (!patient) return;
    setCheckingIn(true);
    setError(null);
    try {
      await createVisit(patient);
      setCheckedIn(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
          <p>LINEアプリから開いているか確認してください。</p>
          <p>LIFF ID: {import.meta.env.VITE_LIFF_ID}</p>
          <div style={{ fontSize: '10px', marginTop: '10px', color: '#666' }}>
            Debug: {auth.currentUser ? `UID: ${auth.currentUser.uid}, Anon: ${auth.currentUser.isAnonymous}` : 'No Auth'}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <div className="container">Please open in LINE.</div>;

  return (
    <div className="container">
      <h1>受付システム</h1>
      {error && <div className="error">{error}</div>}

      {!patient ? (
        <div className="card">
          <h2>初回登録</h2>
          <p>診察券番号を入力してください</p>
          <input
            type="text"
            value={inputPatientId}
            onChange={(e) => setInputPatientId(e.target.value)}
            placeholder="診察券番号"
          />
          <button onClick={handleLink} disabled={registering}>
            {registering ? '登録中...' : '登録する'}
          </button>
        </div>
      ) : (
        <div className="card">
          <h2>ようこそ、{patient.name}さん</h2>
          {checkedIn ? (
            <div className="success">
              <h3>受付完了</h3>
              <p>待合室でお待ちください。</p>
            </div>
          ) : (
            <button className="primary-btn" onClick={handleCheckIn} disabled={checkingIn}>
              {checkingIn ? '処理中...' : '来院受付をする'}
            </button>
          )}
        </div>
      )}

      <div className="footer">
        <p>本日の混雑状況は<a href="/status">こちら</a></p>
      </div>
    </div>
  );
}

export default App;
