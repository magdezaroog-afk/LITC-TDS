import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useLanguage } from '../../engine/ui-loader/LanguageContext';

export const FloatingAIBot: React.FC = () => {
  const theme = useTheme();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'bot' | 'user', text: string}[]>([
    { sender: 'bot', text: language === 'ar' ? 'مرحباً بك! أنا مساعدك الذكي LITC-Bot. كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am your AI assistant LITC-Bot. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    // Simulate AI typing delay
    setTimeout(() => {
      let botResponse = '';
      if (userMsg.includes('sla') || userMsg.includes('تأخير')) {
        botResponse = 'لا يوجد أي تذاكر متأخرة حالياً (SLA Breach = 0). السيرفر في وضع الأمان.';
      } else if (userMsg.includes('rate limit') || userMsg.includes('حماية')) {
        botResponse = 'درع الـ Sovereign Shield يعمل بكفاءة وتم صد 0 هجمات اليوم.';
      } else {
        botResponse = 'تم استلام استفسارك. سيتم تحليله قريباً (محرك الذكاء الاصطناعي قيد المعايرة).';
      }
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: language === 'ar' ? 'auto' : '30px',
          left: language === 'ar' ? '30px' : 'auto',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.colors.primary}, #000)`,
          boxShadow: `0 0 20px ${theme.colors.primary}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        <span style={{ fontSize: '24px' }}>🤖</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: language === 'ar' ? 'auto' : '30px',
          left: language === 'ar' ? '30px' : 'auto',
          width: '350px',
          height: '450px',
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(15px)',
          border: `1px solid ${theme.colors.primary}44`,
          borderRadius: '16px',
          boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${theme.colors.primary}33`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '15px',
            background: `linear-gradient(90deg, ${theme.colors.primary}33, transparent)`,
            borderBottom: `1px solid ${theme.colors.primary}44`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <strong style={{ color: '#fff', fontSize: '15px' }}>LITC-Bot Assistant</strong>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? theme.colors.primary : 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '12px',
                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                maxWidth: '85%',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={language === 'ar' ? 'اسألني...' : 'Ask me...'}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleSend}
              style={{
                background: theme.colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0 15px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};
