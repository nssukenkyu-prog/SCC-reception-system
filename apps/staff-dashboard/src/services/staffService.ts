import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, writeBatch, setDoc, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Visit, PublicStatus } from '@reception/shared';

export const subscribeToVisits = (date: string, callback: (visits: Visit[]) => void, onError?: (error: any) => void) => {
    const q = query(
        collection(db, 'visits'),
        where('date', '==', date),
        orderBy('arrivedAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const visits = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Visit));
        callback(visits);
        updatePublicStatus(visits); // Aggregate on client side
    }, (error) => {
        console.error("Error fetching visits:", error);
        if (onError) onError(error);
    });
};

export const updateVisitStatus = async (visitId: string, status: 'paid' | 'cancelled' | 'active') => {
    const ref = doc(db, 'visits', visitId);
    const updates: any = { status };
    if (status === 'paid') {
        updates.completedAt = serverTimestamp();
    } else if (status === 'active') {
        // If restoring to active, we might want to clear completedAt or keep it as history?
        // Usually clearing it is better to indicate it's not done.
        updates.completedAt = null;
        updates.closedBy = null; // Clear closedBy if it was cancelled
    }
    await updateDoc(ref, updates);
};

export const toggleReceiptStatus = async (visitId: string, currentStatus: boolean) => {
    const ref = doc(db, 'visits', visitId);
    await updateDoc(ref, { receiptStatus: !currentStatus });
};

export const createProxyVisit = async (name: string, patientId: string) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
    await addDoc(collection(db, 'visits'), {
        date: today,
        patientId,
        name,
        status: 'active',
        arrivedAt: serverTimestamp(),
        createdBy: 'staff'
    });
};

export const closeAllActiveVisits = async (visits: Visit[]) => {
    const batch = writeBatch(db);
    const activeVisits = visits.filter(v => v.status === 'active');

    activeVisits.forEach(v => {
        if (v.id) {
            const ref = doc(db, 'visits', v.id);
            batch.update(ref, { status: 'cancelled', closedBy: 'staff' });
        }
    });

    await batch.commit();
};

// Client-side aggregation for public status
const updatePublicStatus = async (visits: Visit[]) => {
    const activeCount = visits.filter(v => v.status === 'active').length;

    // Calculate estimated wait time
    // Simple logic: 15 mins * activeCount (or use historical data if we had it loaded)
    // For now, using the fixed fallback as per plan if data insufficient, but let's try to be smarter if we have completed visits today.

    const completedVisits = visits.filter(v => v.status === 'paid' && v.completedAt && v.arrivedAt);
    let avgServiceTime = 15; // default

    if (completedVisits.length > 0) {
        const totalDuration = completedVisits.reduce((acc, v) => {
            // Timestamp to millis
            const start = v.arrivedAt.toMillis ? v.arrivedAt.toMillis() : v.arrivedAt.seconds * 1000;
            const end = v.completedAt.toMillis ? v.completedAt.toMillis() : v.completedAt.seconds * 1000;
            return acc + (end - start);
        }, 0);
        avgServiceTime = (totalDuration / completedVisits.length) / 60000; // minutes
    }

    const estimatedWaitMinutes = Math.round(avgServiceTime * activeCount);

    const status: PublicStatus = {
        activeCount,
        estimatedWaitMinutes,
        updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'publicStatus', 'today'), status);
};

export const updatePatientName = async (patientId: string, newName: string) => {
    const patientRef = doc(db, 'patients', patientId);
    await updateDoc(patientRef, { name: newName });

    // Also update current active visits for this patient to reflect the new name immediately
    const q = query(
        collection(db, 'visits'),
        where('patientId', '==', patientId),
        where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { name: newName });
    });
    await batch.commit();
};

export const importPatients = async (csvText: string) => {
    const lines = csvText.split('\n');
    const batch = writeBatch(db);
    let count = 0;

    for (const line of lines) {
        const [patientId, name] = line.split(',').map(s => s.trim());
        if (!patientId || !name) continue;

        const ref = doc(db, 'patients', patientId);
        batch.set(ref, {
            patientId,
            name,
            kana: name,
            updatedAt: serverTimestamp()
        }, { merge: true });

        count++;
        if (count >= 450) {
            await batch.commit();
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
    }
    return lines.length;
};

export const getPatientById = async (patientId: string): Promise<{ name: string } | null> => {
    const ref = doc(db, 'patients', patientId);
    const snap = await import('firebase/firestore').then(m => m.getDoc(ref));
    if (snap.exists()) {
        return { name: snap.data().name };
    }
    return null;
};
