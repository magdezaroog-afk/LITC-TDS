import sys

filepath = r"src\components\admin\tabs\UILayoutEngineTab.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target_marker = "      {showNameModal && ("
idx = content.find(target_marker)

if idx == -1:
    print("Marker not found")
    sys.exit(1)

pre_content = content[:idx]

new_modals = """      {showNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '24px', width: '500px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#1D1D1F', marginBottom: '24px', fontSize: '22px', fontWeight: '800' }}>تعريف الواجهة والتصنيف (Configuration)</h3>
            
            <div style={{ textAlign: 'right', marginBottom: '25px', marginTop: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>1. أولاً: اختر التصنيف المعماري (Role / Persona):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'IT_ADMIN', label: 'مسؤول نظام', icon: '💻' },
                  { id: 'OPERATIONAL_MANAGER', label: 'مسؤول تشغيلي', icon: '📊' },
                  { id: 'OPERATIONAL_USER', label: 'مستخدم تشغيلي', icon: '🛠️' },
                  { id: 'END_USER', label: 'مستخدم عادي', icon: '👤' }
                ].map(role => (
                  <div 
                    key={role.id}
                    onClick={() => {
                      setInterfaceCategory(role.id as CoreRole); setManagementLevel(''); setSelectedDept(''); setSelectedSection(''); setSelectedTeam('');
                      setTimeout(() => {
                        const inputEl = document.getElementById('interface_name_input');
                        if(inputEl) inputEl.focus();
                      }, 50);
                    }}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      border: `1px solid ${interfaceCategory === role.id ? '#5856D6' : 'rgba(0,0,0,0.08)'}`, 
                      background: interfaceCategory === role.id ? 'rgba(88,86,214,0.06)' : '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: interfaceCategory === role.id ? '700' : '600',
                      color: interfaceCategory === role.id ? '#5856D6' : '#1D1D1F',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: interfaceCategory === role.id ? '0 4px 12px rgba(88,86,214,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{role.icon}</span>
                    {role.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px', textAlign: 'right' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>2. ثانياً: اختر نطاق الإدارة والتبعية التنظيمية:</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select 
                  value={managementLevel}
                  onChange={e => { setManagementLevel(e.target.value); setSelectedDept(''); setSelectedSection(''); setSelectedTeam(''); }}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                >
                  <option value="">-- مستوى الإدارة (Management Level) --</option>
                  <option value="GENERAL">الإدارة العامة</option>
                  <option value="DEPARTMENT">الإدارة التخصصية</option>
                  <option value="SECTION">قسم تنفيذي</option>
                  <option value="TEAM">وحدة / فريق ميداني</option>
                </select>

                {(managementLevel === 'DEPARTMENT' || managementLevel === 'SECTION' || managementLevel === 'TEAM') && (
                  <select 
                    value={selectedDept}
                    onChange={e => { setSelectedDept(e.target.value); setSelectedSection(''); setSelectedTeam(''); }}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                  >
                    <option value="">-- اختر الإدارة التخصصية --</option>
                    {mockOrgStructure.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}

                {(managementLevel === 'SECTION' || managementLevel === 'TEAM') && selectedDept && (
                  <select 
                    value={selectedSection}
                    onChange={e => { setSelectedSection(e.target.value); setSelectedTeam(''); }}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                  >
                    <option value="">-- اختر القسم التنفيذي --</option>
                    {mockOrgStructure.find(d => d.id === selectedDept)?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}

                {managementLevel === 'TEAM' && selectedSection && (
                  <select 
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                  >
                    <option value="">-- اختر الفريق الميداني --</option>
                    {mockOrgStructure.find(d => d.id === selectedDept)?.sections.find(s => s.id === selectedSection)?.teams?.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>3. ثالثاً: أطلق اسماً تعريفياً للواجهة:</label>
              <input
                id="interface_name_input"
                type="text"
                placeholder={`مثال: لوحة مدير ${mockOrgStructure.find(d=>d.id===selectedDept)?.name || 'العمليات'}`}
                value={interfaceName}
                onChange={(e) => setInterfaceName(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && interfaceName.trim() !== '' && interfaceCategory && managementLevel) {
                    setShowNameModal(false);
                  }
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#FFFFFF', color: '#1D1D1F', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
              />
            </div>
            
            <button 
              onClick={() => {
                if (interfaceName.trim() === '') setInterfaceName('واجهة مخصصة جديدة');
                setShowNameModal(false);
              }}
              disabled={!interfaceCategory || !managementLevel}
              style={{ 
                width: '100%', padding: '16px', background: (!interfaceCategory || !managementLevel) ? '#EBEBEB' : '#5856D6', color: (!interfaceCategory || !managementLevel) ? '#AEAEB2' : '#FFFFFF', border: 'none', borderRadius: '12px', cursor: (!interfaceCategory || !managementLevel) ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: (!interfaceCategory || !managementLevel) ? 'none' : '0 4px 14px rgba(88,86,214,0.35)', transition: 'all 0.2s', fontFamily: 'inherit'
              }}
            >
              بدء التصميم والبناء 🚀
            </button>
            <button
              onClick={() => { setShowNameModal(false); setIsManagerMode(true); }}
              style={{ width: '100%', padding: '16px', background: 'transparent', color: '#6E6E73', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '10px', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1D1D1F'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6E6E73'}
            >
              إلغاء والعودة
            </button>
          </div>
        </div>
      )}

      {/* Save Success Modal */}
      {showSaveReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '24px', width: '500px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '80px', height: '80px', background: '#34C759', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '40px', boxShadow: '0 8px 24px rgba(52,199,89,0.3)' }}>✓</div>
            <h3 style={{ color: '#1D1D1F', marginBottom: '16px', fontSize: '22px', fontWeight: '800' }}>تم الحفظ والاعتماد بنجاح!</h3>
            
            <div style={{ background: '#F5F5F7', padding: '20px', borderRadius: '12px', textAlign: 'right', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '13px', color: '#6E6E73', marginBottom: '8px' }}>تفاصيل النسخة المحفوظة:</div>
              <div style={{ fontWeight: '700', color: '#1D1D1F', marginBottom: '4px', fontSize: '15px' }}>📌 الاسم: {interfaceName || 'واجهة جديدة'}</div>
              <div style={{ fontWeight: '600', color: '#5856D6', marginBottom: '4px', fontSize: '14px' }}>👤 التصنيف: {interfaceCategory}</div>
              <div style={{ fontWeight: '600', color: '#AF52DE', marginBottom: '4px', fontSize: '14px' }}>🏢 مستوى الإدارة: {managementLevel}</div>
              <div style={{ fontWeight: '600', color: '#007AFF', marginBottom: '12px', fontSize: '14px' }}>📦 المكونات النشطة: {activeComponents.length} مكونات</div>
              <div style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>💡 الواجهة جاهزة الآن للعمل بشكل مباشر مع المستخدمين أصحاب هذا الدور وهذه الإدارة.</div>
            </div>

            <button 
              onClick={handleConfirmSave}
              style={{ width: '100%', padding: '16px', background: '#1D1D1F', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'all 0.2s ease', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              العودة إلى مدير الواجهات
            </button>
          </div>
        </div>
      )}

      {/* ─── Data Loss Warning Modal ─── */}
      {showWarningModal && interfaceToLoad && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '24px', width: '450px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#FF3B30', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '30px', boxShadow: '0 8px 24px rgba(255,59,48,0.3)' }}>!</div>
            <h3 style={{ color: '#1D1D1F', margin: '0 0 15px 0', fontSize: '20px', fontWeight: '800' }}>
              تحذير: فقدان العمل غير المحفوظ
            </h3>
            
            <p style={{ color: '#6E6E73', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              أنت تقوم حالياً بتعديل واجهة تحت اسم <strong style={{ color: '#1D1D1F' }}>({interfaceName})</strong>.
              <br/><br/>
              محاولة فتح واجهة <strong style={{ color: '#1D1D1F' }}>({interfaceToLoad.name})</strong> ستؤدي إلى إزالة كل التعديلات الحالية غير المحفوظة والمكونات الموزعة وإعادة تحميل مساحة العمل بالواجهة المطلوبة.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  setInterfaceName(interfaceToLoad.name);
                  setInterfaceCategory(interfaceToLoad.roleType);
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                  setIsManagerMode(false);
                }}
                style={{ flex: 1, padding: '14px', background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(255,59,48,0.3)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                موافق، افتح الواجهة
              </button>
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                }}
                style={{ flex: 1, padding: '14px', background: '#F5F5F7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#EBEBEB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F7'}
              >
                إلغاء والعودة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(pre_content + new_modals)

print("Done")
