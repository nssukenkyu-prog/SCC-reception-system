import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Trash2, CheckCircle, Edit, User } from 'lucide-react';
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

    // Actions Thresholds: 100px

    // Visual indicators
    const checkOpacity = useTransform(x, [50, 100], [0, 1]);
    const trashOpacity = useTransform(x, [-50, -100], [0, 1]);

    // Background color - subtle shift
    const bg = useTransform(x, [-100, 0, 100], ['#fef2f2', '#ffffff', '#eff6ff']);

    // Scale content slightly when dragging
    const scale = useTransform(x, [-100, 0, 100], [0.98, 1, 0.98]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            if (visit.id) onComplete(visit.id);
        } else if (info.offset.x < -100) {
            if (visit.id) onCancel(visit.id);
        }
    };

    return (
        <div style={{ position: 'relative', marginBottom: '16px' }}>
            {/* Swipe Actions Layer (Behind) */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px' }}>

                {/* Left Action (Done) - Visible when swiping RIGHT */}
                <motion.div style={{ opacity: checkOpacity, display: 'flex', alignItems: 'center', color: '#2563eb', fontWeight: '800', fontSize: '1.2rem' }}>
                    <CheckCircle size={28} style={{ marginRight: 10 }} /> PAID
                </motion.div>

                {/* Right Action (Cancel) - Visible when swiping LEFT */}
                <motion.div style={{ opacity: trashOpacity, display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: '800', fontSize: '1.2rem' }}>
                    CANCEL <Trash2 size={28} style={{ marginLeft: 10 }} />
                </motion.div>
            </div>

            {/* Foreground Content Card */}
            <motion.div
                style={{ x, scale, background: bg, position: 'relative', zIndex: 10, borderRadius: '16px', cursor: 'grab', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: 'grabbing' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.3 } }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '60px 120px 1fr 100px auto', alignItems: 'center', padding: '24px 30px', gap: '15px' }}>

                    {/* 1. Queue No */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>Queue</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#374151' }}>{index + 1}</span>
                    </div>

                    {/* 2. Patient ID */}
                    <div style={{ background: '#f3f4f6', padding: '6px 12px', borderRadius: '8px', textAlign: 'center', fontSize: '1rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: '600', color: '#4b5563' }}>
                        {visit.patientId}
                    </div>

                    {/* 3. Name */}
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: 8, background: '#dbeafe', borderRadius: '50%', color: '#2563eb' }}>
                            <User size={20} />
                        </div>
                        {visit.name}
                    </div>

                    {/* 4. Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#374151' }}>
                            {visit.arrivedAt?.toDate ? visit.arrivedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Arrived</span>
                    </div>

                    {/* 5. Edit Action */}
                    <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); visit.patientId && onEdit(visit.patientId, visit.name); }}
                        style={{ padding: '10px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#9ca3af', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Edit size={20} />
                    </button>

                </div>
            </motion.div>
        </div>
    );
};
