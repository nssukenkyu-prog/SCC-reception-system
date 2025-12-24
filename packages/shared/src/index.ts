export interface Patient {
    patientId: string;
    name: string;
    kana: string;
    lineUserId?: string | null;
    firebaseUid?: string | null;
    linkedAt?: any; // Timestamp
    lastVisit?: any; // Timestamp
    birthDate?: string; // YYYY-MM-DD for verification
}

export type VisitStatus = 'active' | 'paid' | 'cancelled';

export interface Visit {
    id?: string;
    date: string; // YYYY-MM-DD
    patientId: string;
    name: string;
    lineUserId?: string;
    firebaseUid?: string; // For security rules (ownership check)
    status: VisitStatus;
    arrivedAt: any; // Timestamp
    completedAt?: any; // Timestamp
    createdBy: 'patient' | 'staff';
    closedBy?: 'staff' | 'system';
    receiptStatus?: boolean; // true = registered in receipt computer
}

export interface PublicStatus {
    activeCount: number;
    estimatedWaitMinutes: number;
    updatedAt: any; // Timestamp
}
