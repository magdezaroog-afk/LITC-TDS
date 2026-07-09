import React from 'react';
import { FieldDefinition } from '../../types/dynamicFields';

interface ActionModalsProps {
  theme: any;
  isSubmitting: boolean;
  isCooldownActive: boolean;

  // Transfer Modal
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  targetDept: string;
  setTargetDept: (dept: string) => void;
  reason: string;
  setReason: (reason: string) => void;
  handleTransferSubmit: () => void;

  // Create Modal
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  createTitle: string;
  setCreateTitle: (title: string) => void;
  createDescription: string;
  setCreateDescription: (desc: string) => void;
  createLocation: string;
  setCreateLocation: (loc: string) => void;
  createDept: string;
  setCreateDept: (dept: string) => void;
  fields: FieldDefinition[];
  dynamicFieldValues: Record<string, string>;
  setDynamicFieldValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleCreateTicketSubmit: () => void;

  // Sub-Ticket Modal
  isSubTicketModalOpen: boolean;
  setIsSubTicketModalOpen: (open: boolean) => void;
  subTicketParentId: string | null;
  subTicketTitle: string;
  setSubTicketTitle: (title: string) => void;
  subTicketDescription: string;
  setSubTicketDescription: (desc: string) => void;
  subTicketDept: string;
  setSubTicketDept: (dept: string) => void;
  handleSubTicketSubmit: () => void;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  theme,
  isSubmitting,
  isCooldownActive,
  isModalOpen,
  setIsModalOpen,
  targetDept,
  setTargetDept,
  reason,
  setReason,
  handleTransferSubmit,
  isCreateModalOpen,
  setIsCreateModalOpen,
  createTitle,
  setCreateTitle,
  createDescription,
  setCreateDescription,
  createLocation,
  setCreateLocation,
  createDept,
  setCreateDept,
  fields,
  dynamicFieldValues,
  setDynamicFieldValues,
  handleCreateTicketSubmit,
  isSubTicketModalOpen,
  setIsSubTicketModalOpen,
  subTicketParentId,
  subTicketTitle,
  setSubTicketTitle,
  subTicketDescription,
  setSubTicketDescription,
  subTicketDept,
  setSubTicketDept,
  handleSubTicketSubmit,
}) => {
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  };

  const modalContentStyle: React.CSSProperties = {
    background: 'rgba(23, 43, 77, 0.85)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    padding: theme.spacing.lg,
    width: '450px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.sm,
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    marginBottom: theme.spacing.md,
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const submitButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#0052cc',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: theme.spacing.sm,
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
  };

  return (
    <>
      {/* Transfer Ticket Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md, fontSize: '16px' }}>تحويل التذكرة إلى قسم آخر</h3>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>القسم المستهدف:</label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            >
              <option value="IT">تقنية المعلومات (IT)</option>
              <option value="Maintenance">الصيانة العامة (Maintenance)</option>
              <option value="HR">الموارد البشرية (HR)</option>
            </select>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>سبب تحويل التذكرة بالتفصيل:</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب التبرير الفني للتحويل..."
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: theme.spacing.md }}>
              <button
                style={{
                  ...cancelButtonStyle,
                  opacity: isSubmitting || isCooldownActive ? 0.5 : 1,
                  cursor: isSubmitting || isCooldownActive ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting || isCooldownActive}
              >
                إلغاء
              </button>
              <button
                style={{
                  ...submitButtonStyle,
                  opacity: isSubmitting || isCooldownActive ? 0.5 : 1,
                  cursor: isSubmitting || isCooldownActive ? 'not-allowed' : 'pointer',
                  backgroundColor: isSubmitting || isCooldownActive ? 'rgba(255,255,255,0.1)' : '#0052cc',
                }}
                onClick={handleTransferSubmit}
                disabled={isSubmitting || isCooldownActive}
              >
                {isSubmitting ? 'جاري التحويل...' : 'تحويل التذكرة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Create Ticket Modal */}
      {isCreateModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md, fontSize: '16px', color: '#00a3ff' }}>إنشاء تذكرة جديدة ديناميكية</h3>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>عنوان التذكرة:</label>
            <input
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="مثال: عطل في طابعة الدور الثاني"
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>وصف التفاصيل:</label>
            <textarea
              rows={3}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="اكتب التبرير الفني والوصف بالتفصيل..."
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>موقع حدوث المشكلة:</label>
            <input
              type="text"
              value={createLocation}
              onChange={(e) => setCreateLocation(e.target.value)}
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>القسم المسؤول المستهدف:</label>
            <select
              value={createDept}
              onChange={(e) => {
                setCreateDept(e.target.value);
                setDynamicFieldValues({});
              }}
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            >
              <option value="IT">تقنية المعلومات (IT)</option>
              <option value="Maintenance">الصيانة العامة (Maintenance)</option>
              <option value="Infrastructure">البنية التحتية (Infrastructure)</option>
            </select>
            {fields.length > 0 && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: theme.spacing.md,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#c8aaff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
                  حقول مخصصة للقسم:
                </div>
                {fields.map((f) => {
                  const val = dynamicFieldValues[f.fieldId] || '';
                  const handleFieldChange = (v: string) => {
                    setDynamicFieldValues((prev) => ({ ...prev, [f.fieldId]: v }));
                  };
                  return (
                    <div key={f.fieldId}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', opacity: 0.9 }}>
                        {f.label} {f.required && <span style={{ color: '#ff3d57' }}>*</span>}
                      </label>
                      {f.type === 'dropdown' ? (
                        <select
                          value={val}
                          onChange={(e) => handleFieldChange(e.target.value)}
                          style={inputStyle}
                          disabled={isSubmitting || isCooldownActive}
                        >
                          <option value="">-- اختر خياراً --</option>
                          {f.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={val}
                          onChange={(e) => handleFieldChange(e.target.value)}
                          placeholder={f.placeholder || `أدخل ${f.label}`}
                          style={inputStyle}
                          disabled={isSubmitting || isCooldownActive}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: theme.spacing.md }}>
              <button
                style={{
                  ...cancelButtonStyle,
                  opacity: isSubmitting || isCooldownActive ? 0.5 : 1,
                  cursor: isSubmitting || isCooldownActive ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting || isCooldownActive}
              >
                إلغاء
              </button>
              <button
                style={{
                  ...submitButtonStyle,
                  opacity: isSubmitting || isCooldownActive ? 0.5 : 1,
                  cursor: isSubmitting || isCooldownActive ? 'not-allowed' : 'pointer',
                  backgroundColor: isSubmitting || isCooldownActive ? 'rgba(255,255,255,0.1)' : '#0052cc',
                }}
                onClick={handleCreateTicketSubmit}
                disabled={isSubmitting || isCooldownActive}
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء التذكرة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Ticket Create Modal */}
      {isSubTicketModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '450px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255, 140, 0, 0.4)' }}>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md, fontSize: '16px', color: '#ff8c00' }}>إنشاء تذكرة فرعية (Sub-Ticket)</h3>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '15px' }}>التذكرة الأم: #{subTicketParentId}</p>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>عنوان التذكرة الفرعية:</label>
            <input
              type="text"
              value={subTicketTitle}
              onChange={(e) => setSubTicketTitle(e.target.value)}
              placeholder="وصف مختصر للمشكلة الفرعية"
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>تفاصيل إضافية:</label>
            <textarea
              rows={3}
              value={subTicketDescription}
              onChange={(e) => setSubTicketDescription(e.target.value)}
              placeholder="اكتب تفاصيل التذكرة الفرعية..."
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            />
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>القسم المستهدف:</label>
            <select
              value={subTicketDept}
              onChange={(e) => setSubTicketDept(e.target.value)}
              style={inputStyle}
              disabled={isSubmitting || isCooldownActive}
            >
              <option value="IT">تقنية المعلومات (IT)</option>
              <option value="Maintenance">الصيانة العامة (Maintenance)</option>
              <option value="Infrastructure">البنية التحتية (Infrastructure)</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: theme.spacing.md }}>
              <button
                style={{
                  ...cancelButtonStyle,
                  opacity: isSubmitting || isCooldownActive ? 0.5 : 1,
                  cursor: isSubmitting || isCooldownActive ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setIsSubTicketModalOpen(false)}
                disabled={isSubmitting || isCooldownActive}
              >
                إلغاء
              </button>
              <button
                style={{
                  ...submitButtonStyle,
                  opacity: isSubmitting || isCooldownActive ? 0.5 : 1,
                  cursor: isSubmitting || isCooldownActive ? 'not-allowed' : 'pointer',
                  backgroundColor: isSubmitting || isCooldownActive ? 'rgba(255,255,255,0.1)' : '#ff8c00',
                }}
                onClick={handleSubTicketSubmit}
                disabled={isSubmitting || isCooldownActive}
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'حفظ وإنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
