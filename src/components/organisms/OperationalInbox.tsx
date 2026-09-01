import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TicketSlaBadge } from "../dashboard/TicketSlaBadge";
import { TicketJourneyTimeline } from "../dashboard/TicketJourneyTimeline";
import { MOCK_JOURNEYS } from "../dashboard/mockJourneyData";
import { Inbox, PlayCircle, Clock, Undo2, CheckCircle, RefreshCw, X } from "lucide-react";
import { useLanguage } from "../../engine/ui-loader/LanguageContext";

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

export interface OperationalTicket {
  id: string;
  title: string;
  sender: string;
  department: string;
  status: "NEW" | "OPEN" | "RESOLVED" | "CLOSED" | "TRANSFERRED" | "PENDING" | "REJECTED";
  priority: "P1" | "P2" | "P3";
  routeColor: string;
  dueDate: string;
  description: string;
}

// Static mock seeds (no t() calls at module level)
const TICKET_SEEDS = [
  { id: "TKT-1045", titleAr: "تحديث صلاحيات نظام ERP", titleEn: "Update ERP System Permissions", sender: "أحمد محمود", dept: "الموارد البشرية", status: "NEW" as const, priority: "P1" as const, color: "#2563eb", offset: 7200000, descAr: "نحتاج إلى إضافة صلاحيات اعتماد الإجازات للمدير الجديد.", descEn: "Need to add leave approval permissions for the new manager." },
  { id: "TKT-1046", titleAr: "عطل في الطابعة المركزية", titleEn: "Central Printer Malfunction", sender: "سارة خالد", dept: "الشؤون الإدارية", status: "OPEN" as const, priority: "P2" as const, color: "#f59e0b", offset: 36000000, descAr: "الطابعة لا تستجيب لأي أوامر طباعة.", descEn: "The printer is not responding to any print commands." },
  { id: "TKT-1047", titleAr: "تجهيز مكتب الموظف الجديد", titleEn: "Prepare New Employee Office", sender: "فهد عبدالله", dept: "التوظيف", status: "NEW" as const, priority: "P2" as const, color: "#10b981", offset: -3600000, descAr: "مطلوب شاشة إضافية ولوحة مفاتيح.", descEn: "Additional monitor and keyboard needed." },
  { id: "TKT-1048", titleAr: "انقطاع الشبكة في الدور الثاني", titleEn: "Network Outage on 2nd Floor", sender: "نورة محمد", dept: "المبيعات", status: "PENDING" as const, priority: "P1" as const, color: "#e11d48", offset: 86400000, descAr: "تم طلب معلومات إضافية عن رقم المنفذ الجداري.", descEn: "Additional info requested about the wall port number." },
  { id: "TKT-1049", titleAr: "طلب ترخيص برنامج فوتوشوب", titleEn: "Photoshop License Request", sender: "علي حسن", dept: "التسويق", status: "REJECTED" as const, priority: "P3" as const, color: "#8b5cf6", offset: 172800000, descAr: "تم رفض الحل لعدم تفعيل النسخة بشكل صحيح.", descEn: "Solution rejected because the version was not activated properly." },
];

const actionBtnStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: "6px", background: bg, color: color,
  border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "13px",
  fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
  boxShadow: bg !== "transparent" && bg !== "#f1f5f9" ? `0 4px 10px ${bg}40` : "none",
});

export const OperationalInbox: React.FC = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const initialTickets = useMemo<OperationalTicket[]>(() =>
    TICKET_SEEDS.map(s => ({
      id: s.id,
      title: isAr ? s.titleAr : s.titleEn,
      sender: s.sender,
      department: s.dept,
      status: s.status,
      priority: s.priority,
      routeColor: s.color,
      dueDate: new Date(Date.now() + s.offset).toISOString(),
      description: isAr ? s.descAr : s.descEn,
    })), [isAr]);

  const [tickets, setTickets] = useState<OperationalTicket[]>(() =>
    TICKET_SEEDS.map(s => ({
      id: s.id, title: s.titleAr, sender: s.sender, department: s.dept,
      status: s.status, priority: s.priority, routeColor: s.color,
      dueDate: new Date(Date.now() + s.offset).toISOString(), description: s.descAr,
    }))
  );

  // Re-sync titles/descriptions on language change
  React.useEffect(() => {
    setTickets(TICKET_SEEDS.map(s => ({
      id: s.id,
      title: isAr ? s.titleAr : s.titleEn,
      sender: s.sender,
      department: s.dept,
      status: s.status,
      priority: s.priority,
      routeColor: s.color,
      dueDate: new Date(Date.now() + s.offset).toISOString(),
      description: isAr ? s.descAr : s.descEn,
    })));
  }, [isAr]);

  const [activeTab, setActiveTab] = useState<"NEW" | "OPEN" | "OVERDUE" | "PENDING" | "REJECTED" | "RESOLVED">("NEW");
  const [expandedJourneyTicketId, setExpandedJourneyTicketId] = useState<string | null>(null);

  const getFilteredTickets = () => {
    const now = Date.now();
    switch (activeTab) {
      case "NEW": return tickets.filter(t => t.status === "NEW" && new Date(t.dueDate).getTime() >= now);
      case "OPEN": return tickets.filter(t => (t.status === "OPEN" || t.status === "TRANSFERRED") && new Date(t.dueDate).getTime() >= now);
      case "OVERDUE": return tickets.filter(t => t.status !== "RESOLVED" && t.status !== "CLOSED" && new Date(t.dueDate).getTime() < now);
      case "PENDING": return tickets.filter(t => t.status === "PENDING");
      case "REJECTED": return tickets.filter(t => t.status === "REJECTED");
      case "RESOLVED": return tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");
      default: return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();
  const handleStatusChange = (id: string, newStatus: OperationalTicket["status"]) =>
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

  const tabs = [
    { id: "NEW", label: t("ui.auto_1118", "وارد جديد"), icon: Inbox, count: tickets.filter(t => t.status === "NEW" && new Date(t.dueDate).getTime() >= Date.now()).length },
    { id: "OPEN", label: t("ui.in_progress", "قيد المعالجة"), icon: PlayCircle, count: tickets.filter(t => (t.status === "OPEN" || t.status === "TRANSFERRED") && new Date(t.dueDate).getTime() >= Date.now()).length },
    { id: "OVERDUE", label: t("ui.auto_1119", "متأخر"), icon: Clock, count: tickets.filter(t => t.status !== "RESOLVED" && t.status !== "CLOSED" && new Date(t.dueDate).getTime() < Date.now()).length, isDanger: true },
    { id: "PENDING", label: t("ui.auto_1120", "بانتظار العميل"), icon: RefreshCw, count: tickets.filter(t => t.status === "PENDING").length },
    { id: "REJECTED", label: t("ui.auto_1121", "مسترجع"), icon: Undo2, count: tickets.filter(t => t.status === "REJECTED").length, isWarning: true },
    { id: "RESOLVED", label: t("ui.auto_1122", "منجز"), icon: CheckCircle, count: tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(16px)", padding: "8px", borderRadius: "16px", overflowX: "auto", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: isActive ? "#fff" : "transparent", border: isActive ? "1px solid rgba(0,0,0,0.04)" : "1px solid transparent", borderRadius: "12px", cursor: "pointer", color: isActive ? (tab.isDanger ? "#e11d48" : tab.isWarning ? "#ea580c" : "#2563eb") : "#64748b", fontWeight: isActive ? 800 : 600, transition: "all 0.3s", boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.05)" : "none", flexShrink: 0 }}>
              <Icon size={18} />
              {tab.label}
              {tab.count > 0 && <span style={{ background: tab.isDanger ? "#e11d48" : tab.isWarning ? "#f97316" : isActive ? "#2563eb" : "#e2e8f0", color: isActive || tab.isDanger || tab.isWarning ? "#fff" : "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Ticket List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <AnimatePresence mode="popLayout">
          {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
            <motion.div layout key={ticket.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", insetInlineEnd: 0, top: 0, bottom: 0, width: "4px", background: ticket.routeColor }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: "8px" }}>{ticket.id}</span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>{ticket.title}</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                    <span>👤 {ticket.sender} ({ticket.department})</span>
                    <span>•</span>
                    <span style={{ color: ticket.priority === "P1" ? "#e11d48" : ticket.priority === "P2" ? "#f59e0b" : "#3b82f6", fontWeight: 700 }}>{ticket.priority}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>{ticket.description}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                  <TicketSlaBadge dueDate={ticket.dueDate} status={ticket.status} />
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    {activeTab === "NEW" && <button onClick={() => handleStatusChange(ticket.id, "OPEN")} style={actionBtnStyle("#10b981", "#fff")}><PlayCircle size={16} />{t("ui.auto_1128", "استلام")}</button>}
                    {activeTab === "OPEN" && <>
                      <button onClick={() => handleStatusChange(ticket.id, "RESOLVED")} style={actionBtnStyle("#10b981", "#fff")}><CheckCircle size={16} />{t("ui.auto_1129", "إنجاز")}</button>
                      <button onClick={() => handleStatusChange(ticket.id, "PENDING")} style={actionBtnStyle("#f1f5f9", "#475569")}><RefreshCw size={16} />{t("ui.auto_1130", "تعليق")}</button>
                    </>}
                    {activeTab === "REJECTED" && <button onClick={() => handleStatusChange(ticket.id, "OPEN")} style={actionBtnStyle("#3b82f6", "#fff")}><Undo2 size={16} />{t("ui.auto_1131", "إعادة فتح")}</button>}
                    <button onClick={() => setExpandedJourneyTicketId(ticket.id)} style={actionBtnStyle("#f1f5f9", "#2563eb")}>{t("ui.auto_424", "التفاصيل")}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "60px 20px", textAlign: "center", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📭</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontWeight: 800 }}>{t("ui.auto_1132", "لا توجد تذاكر هنا")}</h3>
              <p style={{ margin: 0 }}>{t("ui.auto_1133", "جميع المهام في هذا التصنيف مكتملة أو فارغة حالياً.")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Journey Modal */}
      <AnimatePresence>
        {expandedJourneyTicketId && MOCK_JOURNEYS["TKT-1045"] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90000 }}>
            <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }} style={{ background: "#fff", width: "550px", maxHeight: "90vh", overflowY: "auto", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", position: "relative", border: "1px solid #e2e8f0" }}>
              <button onClick={() => setExpandedJourneyTicketId(null)} style={{ position: "absolute", top: "20px", insetInlineEnd: "20px", background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
              <div style={{ padding: "24px 24px 0 24px" }}><h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>{t("ui.auto_1134", "تفاصيل التذكرة ورحلتها")}</h3></div>
              <TicketJourneyTimeline ticketId="TKT-1045" nodes={MOCK_JOURNEYS["TKT-1045"]} compactMode={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
