import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const RoleSimulatorTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSimulators, setSavedSimulators] = useState<any[]>([]);

  // Load saved simulators from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('litc_saved_simulators');
    if (saved) {
      try {
        setSavedSimulators(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveSimulators = (list: any[]) => {
    setSavedSimulators(list);
    localStorage.setItem('litc_saved_simulators', JSON.stringify(list));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('litc_token');
      // Using org/users/pool and filtering locally
      const res = await fetch(`/api/v1/org/users/pool`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const query = searchQuery.toLowerCase();
        const allUsers = data.users || [];
        const filtered = allUsers.filter((u: any) => 
          (u.fullName && u.fullName.toLowerCase().includes(query)) ||
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.department?.name && u.department.name.toLowerCase().includes(query))
        );
        setUsers(filtered);
      } else {
        setError(data.message || 'فشل البحث عن المستخدمين');
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في الشبكة');
    } finally {
      setIsLoading(false);
    }
  };

  const addToSimulator = (user: any) => {
    if (!savedSimulators.find(s => s.id === user.id)) {
      saveSimulators([...savedSimulators, user]);
    }
  };

  const removeFromSimulator = (id: number) => {
    saveSimulators(savedSimulators.filter(s => s.id !== id));
  };

  const impersonate = async (userId: number) => {
    try {
      const token = localStorage.getItem('litc_token');
      const res = await fetch('/api/v1/auth/impersonate', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId: userId })
      });
      
      const data = await res.json();
      if (data.success) {
        // Open a new window/tab with a special parameter
        const url = `${window.location.origin}/login?impersonate=${data.token}`;
        window.open(url, '_blank');
      } else {
        alert(data.error || 'فشل الدخول بحساب المستخدم');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال');
    }
  };

  return (
    <div style={{ padding: '24px', direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#1D1D1F', fontSize: '24px', fontWeight: 800 }}>محاكي بيئة العمل الحقيقية (Impersonation)</h2>
        <p style={{ margin: 0, color: '#6E6E73', fontSize: '14px' }}>
          أضف مستخدمين حقيقيين من المنظومة لاختبار سير العمل (Workflows) والتأكد من الصلاحيات والواجهات المخصصة لهم بشكل فعلي.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* شريط البحث */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>البحث عن موظف / مستخدم</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="اكتب اسم الموظف، البريد، أو الإدارة..."
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
            <button type="submit" disabled={isLoading} style={{ padding: '0 20px', background: '#6366f1', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {isLoading ? 'جاري...' : 'بحث'}
            </button>
          </form>

          {error && <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.fullName || u.username}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email} • {u.role?.name} • {u.department?.name || 'بدون إدارة'}</div>
                </div>
                <button 
                  onClick={() => addToSimulator(u)}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  إضافة للمحاكي
                </button>
              </div>
            ))}
            {users.length === 0 && !isLoading && !error && searchQuery && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>لا توجد نتائج</div>
            )}
          </div>
        </div>

        {/* قائمة المحاكاة السريعة */}
        <div style={{ width: '400px', background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span>قائمة الاختبار السريعة</span>
            <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{savedSimulators.length}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {savedSimulators.map(s => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ 
                    padding: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', 
                    borderRadius: '10px', border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative'
                  }}
                >
                  <button 
                    onClick={() => removeFromSimulator(s.id)}
                    style={{ position: 'absolute', top: '8px', left: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                  >
                    ×
                  </button>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{s.fullName || s.username}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{s.role?.name} • {s.department?.name || 'بدون إدارة'}</div>
                  
                  <button 
                    onClick={() => impersonate(s.id)}
                    style={{ 
                      width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', 
                      borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                    onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                  >
                    <span>دخول باسم المستخدم</span>
                    <span>→</span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {savedSimulators.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', border: '2px dashed #e2e8f0', borderRadius: '10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎭</div>
                أضف مستخدمين هنا لبدء المحاكاة
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
