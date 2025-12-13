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
  const [inputName, setInputName] = useState('');
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
    if (!user?.userId || !inputPatientId || !inputName) return;
    setRegistering(true);
    setError(null);
    try {
      const p = await linkPatient(inputPatientId, user.userId, inputName);
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
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          style={{
            width: 50, height: 50,
            border: '2px solid transparent',
            borderTopColor: '#00f0ff',
            borderRightColor: '#ff003c',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)'
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <motion.div className="holo-card" variants={containerVariants} initial="hidden" animate="visible">
          <h3 style={{ color: '#ff003c', textShadow: '0 0 10px red' }}>SYSTEM ERROR</h3>
          <p>{error}</p>
          <div style={{ marginTop: 20, fontSize: '0.8rem', opacity: 0.7, fontFamily: 'monospace' }}>
            ENV: {liff.isInClient() ? 'LINE_INTERNAL' : 'EXTERNAL_BROWSER'}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user && !loading) {
    return <div className="app-container"><p>REDIRECTING...</p></div>;
  }

  return (
    <div className="app-container">
      <AnimatePresence mode='wait'>
        {!patient ? (
          <motion.div
            key="register"
            className="holo-card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 10px #00f0ff)' }}>🪪</div>
            </div>
            <h1>デジタル診察券 発行</h1>
            <p>診察券番号と氏名を入力してください</p>

            <div style={{ width: '100%', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                className="holo-input"
                type="text"
                pattern="\d*"
                inputMode="numeric"
                value={inputPatientId}
                onChange={(e) => setInputPatientId(e.target.value)}
                placeholder="診察券番号 (例: 1234)"
              />
              <input
                className="holo-input"
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="氏名 (例: 山田 太郎)"
                style={{ textAlign: 'left' }}
              />
            </div>

            <motion.button
              className="holo-btn"
              onClick={handleLink}
              disabled={registering || !inputPatientId || !inputName}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
            >
              {registering ? '発行中...' : 'デジタル診察券を作成'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="holo-card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header / Logo Area */}
            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, background: '#00f0ff', borderRadius: '50%', boxShadow: '0 0 10px #00f0ff' }}></div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>SPORT CURE CENTER</div>
            </div>

            <div style={{ margin: '40px 0 20px', padding: '20px', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -10, left: 20, background: '#000', padding: '0 10px', fontSize: '0.7rem', color: '#00f0ff' }}>DIGITAL ID CARD</div>
              <h2 style={{ fontSize: '2rem', margin: '0 0 5px', color: 'white', letterSpacing: '0.05em' }}>{patient.name} <span style={{ fontSize: '1rem' }}>様</span></h2>
              <p style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>No. {patient.patientId}</p>
            </div>

            {checkedIn ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="success-message"
                style={{ marginTop: 30 }}
              >
                ✔ 受付完了
              </motion.div>
            ) : (
              <motion.button
                className="holo-btn"
                onClick={handleCheckIn}
                disabled={checkingIn}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: 40 }}
              >
                {checkingIn ? '処理中...' : '受付する (CHECK-IN)'}
              </motion.button>
            )}

            {checkedIn && (
              <p style={{ marginTop: 20, fontSize: '0.8rem', color: '#0f0', opacity: 0.8 }}>
                待合室でお待ちください。<br />呼び出し状況は下のリンクから確認できます。
              </p>
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
        <a href="https://scc-reception-system-public.web.app" target="_blank">[ リアルタイム呼出状況を確認 ]</a>
      </motion.div>
    </div>
  );
}

export default App;
