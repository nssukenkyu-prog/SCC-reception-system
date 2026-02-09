import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { initLiff } from './liff';
import { getPatientByLineId, createVisit } from './services/patientService';
import type { Patient } from '@reception/shared';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import liff from '@line/liff';
import './App.css';
import { PrivacyPolicy } from './PrivacyPolicy';

function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputPatientId, setInputPatientId] = useState('');
  const [inputName, setInputName] = useState('');
  const [step, setStep] = useState<'input_id' | 'input_name'>('input_id');
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Run both init tasks in parallel to reduce loading time
        const [_, profile] = await Promise.all([
          signInAnonymously(auth),
          initLiff()
        ]);

        setUser(profile);
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

  const handleNextToName = () => {
    if (!inputPatientId) return;
    setStep('input_name');
  };

  const handleLink = async () => {
    if (!user?.userId || !inputPatientId || !inputName) return;

    setRegistering(true);
    setError(null);
    try {
      const { linkPatient } = await import('./services/patientService');
      // Pass both ID and Name to be verified server-side (or securely in service)
      const p = await linkPatient(inputPatientId, user.userId, inputName);
      setPatient(p);
    } catch (e: any) {
      console.error(e);
      alert(e.message); // Show "Invalid ID or Name"
      // Optional: Clear name to force retry
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
            <div style={{ marginBottom: 40, marginTop: 20 }}>
              <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px #00f0ff)' }}>🪪</div>
            </div>

            {/* Header Title */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 900,
              margin: '0 0 30px',
              background: 'linear-gradient(to right, #fff, #00f0ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center'
            }}>
              DIGITAL ID
            </h1>

            {step === 'input_id' && (
              <div className="neo-form-container">
                <p style={{ textAlign: 'center', margin: 0, opacity: 0.8 }}>診察券番号を入力してください</p>
                <div>
                  <label className="neo-label">ID NUMBER</label>
                  <input
                    className="neo-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputPatientId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
                      setInputPatientId(val);
                    }}
                    placeholder="1234"
                    autoFocus
                  />
                </div>
                <motion.button
                  className="neo-btn"
                  onClick={handleNextToName}
                  disabled={!inputPatientId}
                  whileTap={{ scale: 0.95 }}
                >
                  次へ
                </motion.button>
              </div>
            )}

            {step === 'input_name' && (
              <div className="neo-form-container">
                <p style={{ textAlign: 'center', margin: 0 }}>氏名（漢字）を入力してください</p>
                <div>
                  <div style={{ marginBottom: 10, textAlign: 'center', color: '#00f0ff', fontSize: '1rem', fontFamily: 'OCR A Std' }}>
                    No. {inputPatientId}
                  </div>
                  <label className="neo-label">FULL NAME (KANJI)</label>
                  <input
                    className="neo-input"
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="山田 太郎"
                    style={{ textAlign: 'left' }}
                    autoFocus
                  />
                  <p style={{ fontSize: '0.7rem', color: '#666', marginTop: 5 }}>※スペースの有無は無視されます</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <motion.button
                    className="neo-btn"
                    onClick={handleLink}
                    disabled={registering || !inputName}
                    whileTap={{ scale: 0.95 }}
                  >
                    {registering ? '照合中...' : 'アカウント連携'}
                  </motion.button>
                  <button
                    className="neo-btn secondary"
                    onClick={() => { setStep('input_id'); }}
                  >
                    戻る
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="digital-card-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ width: '100%' }}
          >
            {/* Digital Card Replica */}
            <div className="digital-card">
              {/* Top White Bar */}
              <div className="nit-header">
                <div className="header-row">
                  <span className="sc-logo">Sport Cure Center</span>
                  <span className="digital-label">デジタル診察券</span>
                </div>
              </div>

              {/* Black Separator */}
              <div className="black-bar"></div>

              {/* Main Blue Body */}
              <div className="card-body">
                {/* E-Ticket Label Removed */}

                <div className="patient-info">
                  <div className="patient-number">No. {patient.patientId}</div>
                  <div className="patient-name">{patient.name} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>様</span></div>
                </div>
              </div>

              {/* Striped Footer */}
              <div className="card-footer">
                <div className="footer-text">日本体育大学スポーツキュアセンター横浜・健志台接骨院</div>
              </div>
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
                className="checkin-btn"
                onClick={handleCheckIn}
                disabled={checkingIn}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: 40 }}
              >
                {checkingIn ? '処理中...' : '受付する'}
              </motion.button>
            )}

            {checkedIn && (
              <p style={{ marginTop: 20, fontSize: '0.8rem', color: '#0f0', opacity: 0.8 }}>
                待合室でお待ちください。
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ marginTop: 20, textAlign: 'center', opacity: 0.6, fontSize: '0.8rem' }}>
        <Link to="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</Link>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
