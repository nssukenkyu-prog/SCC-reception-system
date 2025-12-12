export interface Patient {
    patientId: string;
    name: string;
    kana: string;
    lineUserId?: string;
    firebaseUid?: string;
    linkedAt?: any; // Timestamp
    lastVisit?: any; // Timestamp
}

export type VisitStatus = 'active' | 'paid' | 'cancelled';

export interface Visit {
    id?: string;
    date: string; // YYYY-MM-DD
    patientId: string;
    name: string;
    lineUserId?: string;
    status: VisitStatus;
    arrivedAt: any; // Timestamp
    completedAt?: any; // Timestamp
    createdBy: 'patient' | 'staff';
    closedBy?: 'staff' | 'system';
}

export interface PublicStatus {
    activeCount: number;
    estimatedWaitMinutes: number;
    updatedAt: any; // Timestamp
}
