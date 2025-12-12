import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, runTransaction, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Patient, Visit } from '@reception/shared';

export const getPatientByLineId = async (lineUserId: string): Promise<Patient | null> => {
    const q = query(collection(db, 'patients'), where('lineUserId', '==', lineUserId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), patientId: snapshot.docs[0].id } as Patient;
};

export const linkPatient = async (patientId: string, lineUserId: string): Promise<Patient> => {
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);

    if (!patientSnap.exists()) {
        // Create new patient if not exists (Self-registration)
        const newPatient: Patient = {
            patientId,
            name: 'ゲスト', // Default name, maybe ask user? But for now simple.
            kana: 'ゲスト',
            lineUserId,
            firebaseUid: auth.currentUser?.uid, // Store Firebase UID for security rules
            linkedAt: serverTimestamp()
        };
        await setDoc(patientRef, newPatient);
        return newPatient;
    }

    const data = patientSnap.data() as Patient;
    if (data.lineUserId) {
        throw new Error('この診察券番号は既に他のLINEアカウントと連携されています。');
    }

    await updateDoc(patientRef, {
        lineUserId,
        linkedAt: serverTimestamp()
    });

    return { ...data, lineUserId, patientId };
};

export const createVisit = async (patient: Patient): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];

    // Transaction to prevent double booking and ensure consistency
    await runTransaction(db, async (transaction) => {
        // Check for existing active visit
        const q = query(
            collection(db, 'visits'),
            where('patientId', '==', patient.patientId),
            where('date', '==', today),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            throw new Error('既に受付済みです。');
        }

        const newVisitRef = doc(collection(db, 'visits'));
        const visit: Visit = {
            date: today,
            patientId: patient.patientId,
            name: patient.name,
            lineUserId: patient.lineUserId,
            status: 'active',
            arrivedAt: serverTimestamp(),
            createdBy: 'patient'
        };

        transaction.set(newVisitRef, visit);
    });
};
