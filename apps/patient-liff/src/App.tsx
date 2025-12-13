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
  const [foundName, setFoundName] = useState('');
  const [step, setStep] = useState<'input_id' | 'confirm_existing' | 'input_new'>('input_id');
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

  const handleCheckId = async () => {
    if (!inputPatientId) return;
    setRegistering(true);
    try {
      const { getPatientById } = await import('./services/patientService');
      const existing = await getPatientById(inputPatientId);
      if (existing) {
        setFoundName(existing.name);
        setStep('confirm_existing');
      } else {
        setStep('input_new');
      }
    } catch (e) {
      console.error(e);
      setStep('input_new');
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
      const p = await linkPatient(inputPatientId, user.userId, nameToUse);
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
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 10px #00f0ff)' }}>🪪</div>
            </div>
            <h1>デジタル診察券 発行</h1>

            {step === 'input_id' && (
              <>
                <p>診察券番号を入力してください</p>
                <div style={{ width: '100%', margin: '20px 0' }}>
                  <input
                    className="holo-input"
                    type="text"
                    pattern="\d*"
                    inputMode="numeric"
                    value={inputPatientId}
                    onChange={(e) => setInputPatientId(e.target.value)}
                    placeholder="例: 1234"
                    autoFocus
                  />
                </div>
                <motion.button
                  className="holo-btn"
                  onClick={handleCheckId}
                  disabled={registering || !inputPatientId}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {registering ? '確認中...' : '次へ'}
                </motion.button>
              </>
            )}

            {step === 'confirm_existing' && (
              <>
                <p>このお名前でよろしいですか？</p>
                <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #00f0ff', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.1)' }}>
                  <h2 style={{ margin: 0, color: '#fff' }}>{foundName} <span style={{ fontSize: '0.8rem' }}>様</span></h2>
                  <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>No. {inputPatientId}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setStep('input_id'); setInputPatientId(''); }}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '4px' }}
                  >
                    戻る
                  </button>
                  <motion.button
                    className="holo-btn"
                    style={{ flex: 2 }}
                    onClick={handleLink}
                    disabled={registering}
                    whileTap={{ scale: 0.95 }}
                  >
                    {registering ? '発行中...' : 'はい、連携します'}
                  </motion.button>
                </div>
              </>
            )}

            {step === 'input_new' && (
              <>
                <p>氏名を入力してください（新規登録）</p>
                <div style={{ width: '100%', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>診察券番号: {inputPatientId}</div>
                  <input
                    className="holo-input"
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="氏名 (例: 山田 太郎)"
                    style={{ textAlign: 'left' }}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setStep('input_id'); }}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '4px' }}
                  >
                    戻る
                  </button>
                  <motion.button
                    className="holo-btn"
                    style={{ flex: 2 }}
                    onClick={handleLink}
                    disabled={registering || !inputName}
                    whileTap={{ scale: 0.95 }}
                  >
                    {registering ? '登録中...' : '登録して連携'}
                  </motion.button>
                </div>
              </>
            )}
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
