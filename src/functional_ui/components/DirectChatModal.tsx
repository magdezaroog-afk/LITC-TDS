import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  CheckCheck
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { DirectChatMessage } from '../types';

export function DirectChatModal() {
  const { 
    activeChatTarget, 
    setActiveChatTarget, 
    user, 
    language 
  } = useHub();

  const [messages, setMessages] = useState<DirectChatMessage[]>([
    {
      id: 'm1',
      senderId: 'target',
      receiverId: user.id,
      text: language === 'ar' ? 'أهلاً بك زميلي العزيز! كيف يمكنني مساعدتك اليوم؟' : 'Hello colleague! How can I assist you today?',
      timestamp: '10:15 AM',
      read: true
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const isRtl = language === 'ar';

  if (!activeChatTarget) return null;

  const targetId = activeChatTarget.email || activeChatTarget.name;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: DirectChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: targetId,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate colleague reply after 1.5s
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          senderId: 'target',
          receiverId: user.id,
          text: isRtl 
            ? 'شكراً لتواصلك! لقد استلمت رسالتك وسأقوم بالرد عليها في أقرب وقت.'
            : 'Thanks for reaching out! Received your message and will get back to you shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true
        }
      ]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveChatTarget(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col h-[560px] text-start rtl:text-right"
        >
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={activeChatTarget.avatar}
                  alt={activeChatTarget.name}
                  className="size-11 rounded-full object-cover border-2 border-white dark:border-slate-700 bg-slate-200 shrink-0"
                />
                <span className="absolute bottom-0 end-0 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                  {activeChatTarget.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {activeChatTarget.role} {activeChatTarget.dept ? `• ${activeChatTarget.dept}` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveChatTarget(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isMine
                        ? 'bg-accent text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-semibold">
                    <span>{msg.timestamp}</span>
                    {isMine && <CheckCheck className="size-3 text-accent" />}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 w-fit">
                <div className="size-1.5 rounded-full bg-slate-400 animate-bounce" />
                <div className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <div className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Type a message...'}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-accent outline-hidden"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
            >
              <Send className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
