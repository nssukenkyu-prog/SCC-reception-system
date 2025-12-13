import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Trash2, CheckCircle, Edit, User, Clock } from 'lucide-react';
import type { Visit } from '@reception/shared';

interface VisitRowProps {
    visit: Visit;
    index: number;
    onEdit: (id: string, name: string) => void;
    onComplete: (id: string) => void;
    onCancel: (id: string) => void;
    onToggleReceipt: (id: string, status: boolean) => void;
}

export const VisitRow = ({ visit, index, onEdit, onComplete, onCancel, onToggleReceipt }: VisitRowProps) => {
    const x = useMotionValue(0);

    // Indicators
    const checkOpacity = useTransform(x, [50, 100], [0, 1]);
    const trashOpacity = useTransform(x, [-50, -100], [0, 1]);

    // Dynamic Background
    const bg = useTransform(x, [-100, 0, 100], [
        'rgba(244, 114, 182, 0.2)', // Cancel
        'rgba(30, 41, 59, 0.6)',    // Neutral
        'rgba(74, 222, 128, 0.2)'   // Done
    ]);

    const borderColor = useTransform(x, [-100, 0, 100], [
        'rgba(244, 114, 182, 0.5)',
        'rgba(255, 255, 255, 0.1)',
        'rgba(74, 222, 128, 0.5)'
    ]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            if (visit.id) onComplete(visit.id);
        } else if (info.offset.x < -100) {
            if (visit.id) onCancel(visit.id);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Background Actions */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
                <motion.div style={{ opacity: checkOpacity, display: 'flex', alignItems: 'center', color: '#4ade80', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '0.1em' }}>
                    <CheckCircle size={32} style={{ marginRight: 15 }} /> CHECKOUT
                </motion.div>
                <motion.div style={{ opacity: trashOpacity, display: 'flex', alignItems: 'center', color: '#f472b6', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '0.1em' }}>
                    CANCEL <Trash2 size={32} style={{ marginLeft: 15 }} />
                </motion.div>
            </div>

            {/* Card Content */}
            <motion.div
                style={{
                    x,
                    background: bg,
                    border: '1px solid',
                    borderColor: borderColor,
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: '24px',
                    cursor: 'grab',
                    backdropFilter: 'blur(10px)'
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
                onClick={() => {
                    // Only toggle if not dragging (x is near 0)
                    if (Math.abs(x.get()) < 5 && visit.id) {
                        onToggleReceipt(visit.id, visit.receiptStatus || false);
                    }
                }}
                whileTap={{ cursor: 'grabbing', scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '60px 140px 1fr 100px 80px auto', alignItems: 'center', padding: '24px 30px', gap: '20px' }}>

                    {/* 1. Number */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>NO.</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>{index + 1}</span>
                    </div>

                    {/* 2. Patient ID */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '10px', textAlign: 'center', fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.05em' }}>
                        {visit.patientId}
                    </div>

                    {/* 3. Name */}
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                            <User size={20} />
                        </div>
                        {visit.name}
                    </div>

                    {/* 4. Time */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
                            <Clock size={14} /> ARRIVED
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#e2e8f0' }}>
                            {visit.arrivedAt?.toDate ? visit.arrivedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                    </div>

                    {/* 5. Receipt Status (New) */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                            style={{
                                width: 40, height: 40,
                                borderRadius: '8px',
                                border: visit.receiptStatus ? '2px solid #4ade80' : '2px solid rgba(255,255,255,0.2)',
                                background: visit.receiptStatus ? 'rgba(74, 222, 128, 0.2)' : 'transparent',
                                color: visit.receiptStatus ? '#4ade80' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                pointerEvents: 'none' // Let parent handle click
                            }}
                        >
                            <CheckCircle size={24} />
                        </button>
                    </div>

                    {/* 6. Edit */}
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); visit.patientId && onEdit(visit.patientId, visit.name); }}
                        style={{
                            width: 44, height: 44,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Edit size={20} />
                    </button>

                </div>
            </motion.div>
        </div>
    );
};
