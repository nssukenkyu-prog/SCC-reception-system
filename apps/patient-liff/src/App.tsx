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
            <h1>Identity Link</h1>
            <p>ACCESS CODE REQUIRED</p>

            <div style={{ width: '100%', margin: '30px 0' }}>
              <input
                className="holo-input"
                type="text"
                pattern="\d*"
                inputMode="numeric"
                value={inputPatientId}
                onChange={(e) => setInputPatientId(e.target.value)}
                placeholder="00000"
              />
            </div>

            <motion.button
              className="holo-btn"
              onClick={handleLink}
              disabled={registering || !inputPatientId}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
            >
              {registering ? 'PROCESSING...' : 'INITIALIZE LINK'}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, background: '#00f0ff', borderRadius: '50%', boxShadow: '0 0 10px #00f0ff' }}></div>
              <div style={{ fontFamily: 'monospace', color: '#00f0ff', letterSpacing: '0.2em' }}>CONNECTED</div>
            </div>

            <h2 style={{ fontSize: '2rem', margin: '0 0 10px', color: 'white' }}>{patient.name}</h2>
            <p style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>ID: {patient.patientId}</p>

            {checkedIn ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="success-message"
                style={{ marginTop: 30 }}
              >
                ✔ ENTRY AUTHORIZED
              </motion.div>
            ) : (
              <motion.button
                className="holo-btn"
                onClick={handleCheckIn}
                disabled={checkingIn}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: 40 }}
              >
                {checkingIn ? 'verifying...' : 'CHECK-IN NOW'}
              </motion.button>
            )}

            {checkedIn && (
              <p style={{ marginTop: 20, fontSize: '0.8rem', color: '#0f0', opacity: 0.8 }}>
                Please wait in the staging area.
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
        <a href="/public-status" target="_blank">[ VIEW LIVE MONITOR ]</a>
      </motion.div>
    </div>
  );
}

export default App;
