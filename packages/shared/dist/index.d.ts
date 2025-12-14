export interface Patient {
    patientId: string;
    name: string;
    kana: string;
    lineUserId?: string | null;
    firebaseUid?: string | null;
    linkedAt?: any;
    lastVisit?: any;
    birthDate?: string;
}
export type VisitStatus = 'active' | 'paid' | 'cancelled';
export interface Visit {
    id?: string;
    date: string;
    patientId: string;
    name: string;
    lineUserId?: string;
    status: VisitStatus;
    arrivedAt: any;
    completedAt?: any;
    createdBy: 'patient' | 'staff';
    closedBy?: 'staff' | 'system';
    receiptStatus?: boolean;
}
export interface PublicStatus {
    activeCount: number;
    estimatedWaitMinutes: number;
    updatedAt: any;
}
