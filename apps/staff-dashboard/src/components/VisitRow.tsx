import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Trash2, CheckCircle, Edit } from 'lucide-react';
import type { Visit } from '@reception/shared';

interface VisitRowProps {
    visit: Visit;
    index: number;
    onEdit: (id: string, name: string) => void;
    onComplete: (id: string) => void;
    onCancel: (id: string) => void;
}

export const VisitRow = ({ visit, index, onEdit, onComplete, onCancel }: VisitRowProps) => {
    const x = useMotionValue(0);
    // const controls = useRef(null); // Unused

    // Background opacity based on swipe distance
    const checkOpacity = useTransform(x, [50, 100], [0, 1]);
    const trashOpacity = useTransform(x, [-50, -100], [0, 1]);

    // Background color
    const bg = useTransform(x, [-100, 0, 100], ['#ffebee', '#ffffff', '#e8f5e9']);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            if (visit.id) onComplete(visit.id);
        } else if (info.offset.x < -100) {
            if (visit.id) onCancel(visit.id);
        }
    };

    return (
        <div className="visit-row-container" style={{ position: 'relative', overflow: 'hidden', marginBottom: '12px', borderRadius: '12px' }}>
            {/* Swipe Actions Background */}
            <div className="visit-row-actions" style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
                <motion.div style={{ opacity: checkOpacity, display: 'flex', alignItems: 'center', color: '#2e7d32', fontWeight: 'bold' }}>
                    <CheckCircle size={24} style={{ marginRight: 8 }} /> 会計へ
                </motion.div>
                <motion.div style={{ opacity: trashOpacity, display: 'flex', alignItems: 'center', color: '#c62828', fontWeight: 'bold' }}>
                    取消 <Trash2 size={24} style={{ marginLeft: 8 }} />
                </motion.div>
            </div>

            {/* Foreground Content */}
            <motion.div
                className="visit-row-content"
                style={{ x, background: bg, position: 'relative', zIndex: 1, padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Snap back
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                whileTap={{ scale: 0.98 }}
            >
                <div className="visit-row-grid" style={{ display: 'grid', gridTemplateColumns: '40px 100px 1fr 100px auto', alignItems: 'center', gap: '10px' }}>

                    {/* 1. No */}
                    <div style={{ fontWeight: 'bold', color: '#666' }}>
                        #{index + 1}
                    </div>

                    {/* 2. Patient ID */}
                    <div style={{ fontFamily: 'monospace', fontSize: '1.1em', fontWeight: '500' }}>
                        {visit.patientId}
                    </div>

                    {/* 3. Name */}
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        {visit.name}
                    </div>

                    {/* 4. Time */}
                    <div style={{ color: '#666', fontSize: '0.9em' }}>
                        {visit.arrivedAt?.toDate ? visit.arrivedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </div>

                    {/* Actions (Edit) */}
                    <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); visit.patientId && onEdit(visit.patientId, visit.name); }}
                        style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    >
                        <Edit size={20} />
                    </button>

                </div>
            </motion.div>
        </div>
    );
};
