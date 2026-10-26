import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../engine/auth/AuthContext';
import { AdminAPI } from '../../services/admin.api';

// LITC Policy 13-1-ح: Automatic session logout after 15 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const WARNING_COUNTDOWN_SECONDS = 60; // Show warning in the last 60 seconds

export const InactivitySessionGuard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_COUNTDOWN_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Reset the activity timestamp
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(WARNING_COUNTDOWN_SECONDS);
    }
  }, [showWarning]);

  // Execute safe termination and token revocation
  const handlePerformLogout = useCallback(async () => {
    setShowWarning(false);
    try {
      await AdminAPI.logout();
    } catch (e) {
      console.warn('[Inactivity Guard] Backend logout call fallback:', e);
    } finally {
      logout();
      window.location.href = '/login?reason=inactivity';
    }
  }, [logout]);

  // Listen to user interaction events (throttled)
  useEffect(() => {
    if (!user) return;

    let throttleTimer: any = null;
    const onUserInteraction = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          recordActivity();
          throttleTimer = null;
        }, 1000); // Throttle events to once per second for max performance
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, onUserInteraction, { passive: true }));

    // Periodic Check every 5 seconds
    timerCheckRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeLeft = INACTIVITY_TIMEOUT_MS - elapsed;

      if (timeLeft <= 0) {
        // Exceeded 15 minutes -> Logout
        handlePerformLogout();
      } else if (timeLeft <= WARNING_COUNTDOWN_SECONDS * 1000) {
        // In the final 60 seconds -> Show warning modal
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(timeLeft / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 5000);

    return () => {
      events.forEach(event => window.removeEventListener(event, onUserInteraction));
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
    };
  }, [user, recordActivity, handlePerformLogout]);

  // Second-by-second countdown when warning is active
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handlePerformLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setSecondsRemaining(WARNING_COUNTDOWN_SECONDS);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, handlePerformLogout]);

  if (!user || !showWarning) return null;

  const progressPercent = ((WARNING_COUNTDOWN_SECONDS - secondsRemaining) / WARNING_COUNTDOWN_SECONDS) * 100;

  return (
    <div 
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
        fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif"
      }}
    >
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(243, 108, 33, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Warning Strip */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: '#f1f5f9'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: '#f36c21',
            transition: 'width 1s linear'
          }} />
        </div>

        {/* Pulsing Shield Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(243, 108, 33, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f36c21',
          boxShadow: '0 0 20px rgba(243, 108, 33, 0.25)'
        }}>
          <ShieldAlert size={34} />
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#135d79' }}>
            تنبيه أمني: انتهاء الجلسة بسبب الخمول
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
            وفقاً لـ <strong>سياسة أمن المعلومات لشركة LITC (المعيار 13-1-ح)</strong>، سيتم تسجيل خروجك تلقائياً بعد مرور 15 دقيقة من عدم النشاط لحماية بياناتك.
          </p>
        </div>

        {/* Countdown Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '30px',
          background: '#fff7ed',
          border: '1px solid #ffedd5',
          color: '#ea580c',
          fontWeight: '800',
          fontSize: '16px'
        }}>
          <Clock size={20} />
          <span>سيتم إغلاق الجلسة خلال: {secondsRemaining} ثانية</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={recordActivity}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: '#135d79',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(19, 93, 121, 0.3)'
            }}
          >
            <RefreshCw size={16} />
            <span>تمديد الجلسة ومتابعة العمل</span>
          </button>

          <button
            onClick={handlePerformLogout}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} />
            <span>خروج آمن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
