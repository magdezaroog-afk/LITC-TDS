import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

interface Robot3DProps {
  onCtaClick?: () => void;
  ctaLabel?: string;
}

// Particle component
const Particle: React.FC<{ angle: number; radius: number; size: number; delay: number; color: string }> = ({
  angle, radius, size, delay, color
}) => {
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.div
      animate={{
        x: [x - 6, x + 6, x - 6],
        y: [y - 4, y + 4, y - 4],
        opacity: [0.4, 1, 0.4],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
        pointerEvents: 'none',
      }}
    />
  );
};

// Orbiting Ring component
const OrbitRing: React.FC<{
  size: number;
  rotateX: number;
  rotateZ: number;
  duration: number;
  color: string;
  opacity: number;
  thickness?: number;
}> = ({ size, rotateX, rotateZ, duration, color, opacity, thickness = 1.5 }) => (
  <motion.div
    animate={{ rotateY: [0, 360] }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      border: `${thickness}px solid ${color}`,
      top: '50%',
      left: '50%',
      marginTop: -size / 2,
      marginLeft: -size / 2,
      transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
      opacity,
      pointerEvents: 'none',
      boxShadow: `0 0 8px ${color}40`,
    }}
  />
);

export const Robot3D: React.FC<Robot3DProps> = ({ onCtaClick, ctaLabel = 'إنشاء طلب' }) => {
  const [hovered, setHovered] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 30, damping: 12 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const rotateY = useTransform(springX, [-180, 180], [-18, 18]);
  const rotateX = useTransform(springY, [-180, 180], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.set(e.clientX - cx);
    mouseY.set(e.clientY - cy);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  const particles = [
    { angle: 30, radius: 90, size: 5, delay: 0, color: 'rgba(14,165,233,0.9)' },
    { angle: 120, radius: 85, size: 4, delay: 0.8, color: 'rgba(139,92,246,0.9)' },
    { angle: 210, radius: 92, size: 6, delay: 1.4, color: 'rgba(59,130,246,0.9)' },
    { angle: 300, radius: 80, size: 3, delay: 2.1, color: 'rgba(14,165,233,0.9)' },
    { angle: 75, radius: 75, size: 4, delay: 0.4, color: 'rgba(168,85,247,0.8)' },
    { angle: 250, radius: 88, size: 5, delay: 1.8, color: 'rgba(99,102,241,0.9)' },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '900px',
        width: '240px',
        height: '290px',
        userSelect: 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient glow on ground */}
      <motion.div
        animate={{
          opacity: hovered ? 0.7 : 0.4,
          scale: hovered ? 1.3 : 1,
        }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '130px',
          height: '22px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.5) 0%, rgba(14,165,233,0.3) 50%, transparent 70%)',
          filter: 'blur(10px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Main 3D floating group */}
      <motion.div
        style={{
          rotateY,
          rotateX,
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: '180px',
          height: '180px',
          marginBottom: '20px',
        }}
        animate={{ y: [0, -14, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        {/* === ORBITING RINGS === */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
          <OrbitRing size={160} rotateX={70} rotateZ={0} duration={8} color="rgba(99,102,241,0.8)" opacity={0.7} thickness={1.5} />
          <OrbitRing size={140} rotateX={20} rotateZ={45} duration={12} color="rgba(14,165,233,0.7)" opacity={0.6} thickness={1} />
          <OrbitRing size={175} rotateX={50} rotateZ={-30} duration={16} color="rgba(168,85,247,0.6)" opacity={0.5} thickness={1} />
        </div>

        {/* === FLOATING PARTICLES === */}
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* === CORE ORB === */}
        <motion.div
          animate={{
            scale: hovered ? [1, 1.08, 1] : [1, 1.03, 1],
            boxShadow: hovered
              ? ['0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(14,165,233,0.3)', '0 0 60px rgba(99,102,241,0.9), 0 0 120px rgba(14,165,233,0.5)', '0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(14,165,233,0.3)']
              : ['0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(14,165,233,0.2)', '0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(14,165,233,0.3)', '0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(14,165,233,0.2)'],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '90px',
            height: '90px',
            marginTop: '-45px',
            marginLeft: '-45px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(199,210,254,0.9) 20%, rgba(99,102,241,0.8) 50%, rgba(30,64,175,0.9) 75%, rgba(15,23,42,0.95) 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Inner shimmer sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />

          {/* Inner glow dot */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '22%',
              left: '28%',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 70%, transparent 100%)',
              filter: 'blur(2px)',
            }}
          />
        </motion.div>

        {/* Outer glow ring around core */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '110px',
            height: '110px',
            marginTop: '-55px',
            marginLeft: '-55px',
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.5)',
            pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '128px',
            height: '128px',
            marginTop: '-64px',
            marginLeft: '-64px',
            borderRadius: '50%',
            border: '1px solid rgba(14,165,233,0.4)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* === CTA BUTTON === */}
      <motion.button
        onClick={onCtaClick}
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => setCtaHovered(false)}
        animate={{
          y: hovered ? -2 : 0,
          boxShadow: ctaHovered
            ? '0 8px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.3)'
            : '0 2px 12px rgba(99,102,241,0.15)',
        }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '11px 28px',
          borderRadius: '50px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(14,165,233,0.08) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.35)',
          color: '#1e40af',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}
      >
        {/* Shimmer on hover */}
        <AnimatePresence>
          {ctaHovered && (
            <motion.div
              key="shimmer"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                transform: 'skewX(-15deg)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* Pulsing dot */}
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            boxShadow: '0 0 8px rgba(99,102,241,0.6)',
            flexShrink: 0,
          }}
        />
        {ctaLabel}
      </motion.button>
    </div>
  );
};

export default Robot3D;
