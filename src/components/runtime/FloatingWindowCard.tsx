import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface FloatingWindowCardProps {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const FloatingWindowCard: React.FC<FloatingWindowCardProps> = ({ id, title, onClose, children }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`floating-window-card ${isMaximized ? 'floating-window-card--maximized' : 'floating-window-card--normal'}`}
    >
      {/* Header */}
      <div className="floating-window-card__header">
        <h3 className="floating-window-card__title">{title}</h3>
        <div className="floating-window-card__controls">
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'تصغير' : 'تكبير'}
            className="floating-window-card__ctrl-btn"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={onClose}
            title="إغلاق"
            className="floating-window-card__ctrl-btn floating-window-card__ctrl-btn--close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="floating-window-card__body">
        {children}
      </div>
    </motion.div>
  );
};
