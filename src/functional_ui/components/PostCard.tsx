import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Star } from 'lucide-react';
import { useHub } from '../context/HubContext';

export function PostCard({ post }: any) {
  const { t, language } = useHub();
  const [liked, setLiked] = useState(post.hasLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>(Array.isArray(post.comments) ? post.comments : []);

  const handleLike = async () => {
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(likesCount + (newLiked ? 1 : -1));

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/functional/posts/${post.id}/react`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Revert if failed
      setLiked(!newLiked);
      setLikesCount(likesCount + (!newLiked ? 1 : -1));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/functional/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: commentText })
      });
      const data = await res.json();
      if (data.success) {
        setComments([{
          id: data.data.id,
          author: data.data.author?.fullName || 'أنا',
          authorAvatar: data.data.author?.avatarUrl || '',
          text: data.data.body,
          time: new Date().toISOString()
        }, ...comments]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[30px] p-5 sm:p-6 mb-5 border border-white/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group text-start rtl:text-right"
    >
      <header className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="size-11 rounded-2xl bg-primary border-2 border-white dark:border-slate-700 shadow-xs object-cover" 
          />
          {post.type === 'official' && (
            <div className="absolute -bottom-1 -right-1 size-4 bg-accent rounded-full border-2 border-white flex items-center justify-center shadow-xs">
              <Star className="size-2 text-white fill-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{post.author.name}</h3>
            {post.type === 'official' ? (
              <span className="px-2.5 py-0.5 bg-accent-soft text-accent text-[10px] font-black rounded-full border border-accent/20">
                {t('officialCircular')}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full">
                {post.author.department}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
            {post.author.role} • {post.timestamp}
          </p>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <MoreHorizontal className="size-4" />
        </button>
      </header>

      <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
        {post.content}
      </p>

      {post.image && (
        <div className="mt-4 rounded-[22px] overflow-hidden shadow-sm border border-slate-100/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <img
            src={post.image}
            alt=""
            className="w-full aspect-video object-cover hover:scale-[1.01] transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {post.video && (
        <div className="mt-4 rounded-[22px] overflow-hidden shadow-sm border border-slate-100/80 dark:border-slate-800 bg-black">
          <video
            src={post.video}
            className="w-full aspect-video object-cover"
            controls
            playsInline
            muted
            loop
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all active:scale-95
              ${liked 
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'}
            `}
          >
            <Heart className={`size-3.5 ${liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span>{likesCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all active:scale-95"
          >
            <MessageCircle className="size-3.5 text-slate-400" />
            <span>{comments.length}</span>
          </button>
          <button className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-2xl transition-all active:scale-95">
            <Share2 className="size-3.5" />
          </button>
        </div>

        <div className="flex -space-x-1.5 rtl:space-x-reverse">
          {['👍', '🔥', '👏'].map((emoji, i) => (
            <div 
              key={i} 
              className="size-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center text-[10px] shadow-2xs hover:scale-110 transition-transform"
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتب تعليقاً..." 
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button 
              onClick={handleComment}
              className="px-4 py-2 bg-accent text-white font-bold rounded-xl text-sm transition-colors hover:bg-accent-hover"
            >
              إرسال
            </button>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <img src={c.authorAvatar || 'https://i.pravatar.cc/150'} className="size-8 rounded-full bg-slate-200 object-cover" alt={c.author} />
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.author}</span>
                    <span className="text-[10px] text-slate-400">الآن</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  );
}
