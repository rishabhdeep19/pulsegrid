import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function SpatialCard({ children, className = '', isHealthy = true }) {
const cardRef = useRef(null);

const mouseX = useMotionValue(0.5);
const mouseY = useMotionValue(0.5);

const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), {
    stiffness: 260,
    damping: 22,
});
const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), {
    stiffness: 260,
    damping: 22,
});

const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
};

const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
};

return (
    <div style={{ perspective: 1100 }} className="h-full">
    <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
        rotateX,
        rotateY,
        }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className={`spatial-glass relative rounded-3xl p-6 transition-colors duration-300 ${
        isHealthy
            ? 'hover:border-sky-400/35'
            : 'border-rose-500/40 shadow-[0_0_40px_-10px_rgba(244,63,94,0.35)]'
        } ${className}`}
    >
        {children}
    </motion.div>
    </div>
);
}