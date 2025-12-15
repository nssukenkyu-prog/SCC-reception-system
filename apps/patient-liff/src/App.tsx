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
  const [inputBirthDate, setInputBirthDate] = useState('');
  const [inputName, setInputName] = useState('');
  const [foundName, setFoundName] = useState('');
  const [step, setStep] = useState<'input_id' | 'input_dob' | 'confirm_existing' | 'input_new'>('input_id');
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
      } catch (e: any) {
        console.error(e);
        setError(`LIFF Error: ${e.message || JSON.stringify(e)}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleNextToDob = () => {
    if (!inputPatientId) return;
    setStep('input_dob');
  };

  const handleVerifyDob = async () => {
    if (!inputPatientId || inputBirthDate.length !== 8) return;
    setRegistering(true);
    try {
      // Import verifyPatient dynamically or statically (using dynamic for consistency with previous code style if needed, but static is better. 
      // The previous code had dynamic import for getPatientById which was wrong. Let's assume static import is available or fix imports at top)
      // Actually, let's fix the imports at the top first, but here we just use the function.
      // Wait, `verifyPatient` needs to be imported. I'll add it to the top import list in a separate edit or assume it's there?
      // No, I must ensure it works. I will use the dynamic import here correctly this time.
      const { verifyPatient } = await import('./services/patientService');

      const existing = await verifyPatient(inputPatientId, inputBirthDate);

      if (existing) {
        setFoundName(existing.name);
        setStep('confirm_existing');
      } else {
        // Not found -> New Registration
        setStep('input_new');
      }
    } catch (e: any) {
      console.error(e);
      // DOB mismatch or other error
      alert(e.message);
      // Stay on DOB step or clear input?
      setInputBirthDate('');
    } finally {
      setRegistering(false);
    }
  };

  const handleLink = async () => {
    if (!user?.userId || !inputPatientId) return;
    const nameToUse = step === 'confirm_existing' ? foundName : inputName;
    if (!nameToUse) return;

    setRegistering(true);
    setError(null);
    try {
      // Pass birthDate as 4th argument
      await linkPatient(inputPatientId, user.userId, nameToUse, inputBirthDate);
      // Refresh patient
      const p = await getPatientByLineId(user.userId);
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
                  onClick={handleNextToDob}
                  disabled={!inputPatientId}
                  whileTap={{ scale: 0.95 }}
                >
                  次へ
                </motion.button>
              </div>
            )}

            {step === 'input_dob' && (
              <div className="neo-form-container">
                <div style={{ marginBottom: 10, textAlign: 'center', color: '#00f0ff', fontSize: '1.2rem', fontFamily: 'OCR A Std' }}>ID: {inputPatientId}</div>
                <p style={{ textAlign: 'center', margin: 0, opacity: 0.8 }}>生年月日を入力してください</p>
                <div>
                  <label className="neo-label">BIRTH DATE (YYYYMMDD)</label>
                  <input
                    className="neo-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={inputBirthDate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setInputBirthDate(val);
                    }}
                    placeholder="19900101"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <motion.button
                    className="neo-btn"
                    onClick={handleVerifyDob}
                    disabled={registering || inputBirthDate.length !== 8}
                    whileTap={{ scale: 0.95 }}
                  >
                    {registering ? '確認中...' : '確認する'}
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

            {step === 'confirm_existing' && (
              <div className="neo-form-container">
                <p style={{ textAlign: 'center', margin: 0 }}>このお名前でよろしいですか？</p>
                <div style={{
                  padding: '20px',
                  border: '2px solid #00f0ff',
                  borderRadius: '16px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#00f0ff', marginBottom: 5 }}>No. {inputPatientId}</div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '2rem' }}>{foundName} <span style={{ fontSize: '1rem' }}>様</span></h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <motion.button
                    className="neo-btn"
                    onClick={handleLink}
                    disabled={registering}
                    whileTap={{ scale: 0.95 }}
                  >
                    {registering ? '発行中...' : 'はい、連携します'}
                  </motion.button>
                  <button
                    className="neo-btn secondary"
                    onClick={() => { setStep('input_dob'); }}
                  >
                    戻る
                  </button>
                </div>
              </div>
            )}

            {step === 'input_new' && (
              <div className="neo-form-container">
                <p style={{ textAlign: 'center', margin: 0 }}>氏名を入力してください</p>
                <div>
                  <div style={{ marginBottom: 10, textAlign: 'center', color: '#00f0ff', fontSize: '1rem', fontFamily: 'OCR A Std' }}>
                    No. {inputPatientId} / {inputBirthDate}
                  </div>
                  <label className="neo-label">FULL NAME</label>
                  <input
                    className="neo-input"
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="山田 太郎"
                    style={{ textAlign: 'left' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <motion.button
                    className="neo-btn"
                    onClick={handleLink}
                    disabled={registering || !inputName}
                    whileTap={{ scale: 0.95 }}
                  >
                    {registering ? '登録中...' : '登録して連携'}
                  </motion.button>
                  <button
                    className="neo-btn secondary"
                    onClick={() => { setStep('input_dob'); }}
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
    </div>
  );
}

export default App;
