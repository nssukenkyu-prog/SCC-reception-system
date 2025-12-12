import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, writeBatch, setDoc, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Visit, PublicStatus } from '@reception/shared';

export const subscribeToVisits = (date: string, callback: (visits: Visit[]) => void) => {
    const q = query(
        collection(db, 'visits'),
        where('date', '==', date),
        orderBy('arrivedAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const visits = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Visit));
        callback(visits);
        updatePublicStatus(visits); // Aggregate on client side
    });
};

export const updateVisitStatus = async (visitId: string, status: 'paid' | 'cancelled') => {
    const ref = doc(db, 'visits', visitId);
    const updates: any = { status };
    if (status === 'paid') {
        updates.completedAt = serverTimestamp();
    }
    await updateDoc(ref, updates);
};

export const createProxyVisit = async (name: string, patientId: string) => {
    const today = new Date().toISOString().split('T')[0];
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
