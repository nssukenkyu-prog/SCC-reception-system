import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { initLiff } from './liff';
import { getPatientByLineId, linkPatient, createVisit } from './services/patientService';
import type { Patient } from '@reception/shared';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import liff from '@line/liff';
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
        setUser(profile); // Might be null via redirect, that's fine
        if (profile?.userId) {
          const p = await getPatientByLineId(profile.userId);
          setPatient(p);
        }
      } catch (e: any) {
        console.error(e);
        setError(`LIFF Error: ${e.message || JSON.stringify(e)}`);
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

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <motion.div className="glass-card" variants={containerVariants} initial="hidden" animate="visible">
          <h3 style={{ color: '#ef4444' }}>エラーが発生しました</h3>
          <p>{error}</p>
          <div style={{ marginTop: 20, fontSize: '0.8rem', opacity: 0.7 }}>
            環境: {liff.isInClient() ? 'LINE In-App' : 'External Browser'}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user && !loading) {
    /* Usually initLiff redirects, but if we are here, something missed. */
    return <div className="app-container"><p>Redirecting to Login...</p></div>;
  }

  return (
    <div className="app-container">
      <AnimatePresence mode='wait'>
        {!patient ? (
          <motion.div
            key="register"
            className="glass-card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h1>Welcome</h1>
            <p>診察券番号を入力して<br />連携を開始してください</p>

            <div style={{ width: '100%', margin: '20px 0' }}>
              <input
                className="modern-input"
                type="text"
                pattern="\d*"
                inputMode="numeric"
                value={inputPatientId}
                onChange={(e) => setInputPatientId(e.target.value)}
                placeholder="12345"
              />
            </div>

            <motion.button
              className="glass-btn primary-btn"
              onClick={handleLink}
              disabled={registering || !inputPatientId}
              whileTap={{ scale: 0.95 }}
            >
              {registering ? '登録中...' : '連携する'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="glass-card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '3rem' }}>🏥</div>
            </div>
            <h2>{patient.name} 様</h2>
            <p>こんにちは。本日はどのようなご用件でしょうか？</p>

            {checkedIn ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="status-badge success"
                style={{ marginTop: 20, padding: '15px 30px', fontSize: '1.2rem' }}
              >
                ✅ 受付完了
              </motion.div>
            ) : (
              <motion.button
                className="glass-btn primary-btn"
                onClick={handleCheckIn}
                disabled={checkingIn}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: 30, fontSize: '1.3rem', padding: '24px' }}
              >
                {checkingIn ? '処理中...' : '受付する'}
              </motion.button>
            )}

            {checkedIn && (
              <p style={{ marginTop: 20, fontSize: '0.9rem' }}>待合室でお待ちください。<br />順番が近づいたらお呼びします。</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="footer-link"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <a href="/public-status" target="_blank">現在の混雑状況を確認する</a>
      </motion.div>
    </div>
  );
}

export default App;
