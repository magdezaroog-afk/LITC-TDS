import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Smile, Send, X, Sparkles } from 'lucide-react';
import { useHub } from '../context/HubContext';

export function CreatePostCard() {
  const { user, addPost, language, t } = useHub();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRtl = language === 'ar';

  const emojis = ['👏', '🔥', '🚀', '✨', '🎉', '💼', '💪', '❤️', '🌟', '☕'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage(uploadEvent.target?.result as string);
        setIsExpanded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    setIsExpanded(true);
  };

  const handleSubmit = () => {
    if (!content.trim() && !selectedImage) return;

    addPost({
      content,
      image: selectedImage || undefined,
      type: 'community',
    });

    setContent('');
    setSelectedImage(null);
    setIsExpanded(false);
    setShowEmojiPicker(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[32px] p-5 space-y-4 border border-white/80 dark:border-slate-800 shadow-md relative overflow-hidden text-start rtl:text-right"
    >
      <div className="flex items-center gap-3">
        <img
          src={user.avatar}
          alt=""
          className="size-11 rounded-full bg-primary border-2 border-white dark:border-slate-700 shadow-sm object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t('welcomeUser')} {user.name.split(' ')[0]} 👋
            </p>
            <span className="px-2 py-0.5 bg-accent-soft text-accent text-[10px] font-black rounded-full uppercase">
              {t('communitySpace')}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {t('communitySub')}
          </p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          rows={isExpanded ? 3 : 2}
          placeholder={isRtl ? 'بماذا تفكر اليوم؟ شارك فريقك التحديثات واللحظات المميزة...' : "What's on your mind? Share updates with your team..."}
          className="w-full bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-100 dark:border-slate-700 focus:border-accent focus:outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed shadow-inner"
        />

        {selectedImage && (
          <div className="mt-3 relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-h-48">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-48 object-cover rounded-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 left-2 size-7 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition-all"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-accent-soft hover:text-accent text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Image className="size-4 text-accent" />
            <span className="hidden sm:inline">{isRtl ? 'إرفاق صورة' : 'Attach Photo'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Smile className="size-4 text-amber-500" />
              <span className="hidden sm:inline">{isRtl ? 'تفاعل سريع' : 'Emoji'}</span>
            </button>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute bottom-full mb-2 start-0 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex gap-1 z-30"
                >
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleAddEmoji(emoji)}
                      className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-base transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setContent('');
                setSelectedImage(null);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() && !selectedImage}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:brightness-105 disabled:opacity-40 disabled:hover:brightness-100 text-white rounded-2xl text-xs font-black shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            <Send className="size-3.5 rtl:rotate-0 rotate-180" strokeWidth={2.5} />
            <span>{isRtl ? 'نشر الآن' : 'Post Now'}</span>
          </button>
        </div>
      </div>
    </motion.section>
  );
}
