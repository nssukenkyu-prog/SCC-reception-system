export interface Patient {
    patientId: string;
    name: string;
    kana: string;
    lineUserId?: string;
    firebaseUid?: string;
    linkedAt?: any;
    lastVisit?: any;
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
}
export interface PublicStatus {
    activeCount: number;
    estimatedWaitMinutes: number;
    updatedAt: any;
}
