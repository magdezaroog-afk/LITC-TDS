import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HeartPulse, 
  Users, 
  Briefcase, 
  X, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Ticket 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHub } from '../context/HubContext';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
  const { user, userRequests, language, t } = useHub();
  const isRtl = language === 'ar';
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const activeRequestsCount = (userRequests || []).filter((r) => r.status === 'pending' || r.status === 'in_progress').length;

  const menuItems = [
    { 
      path: '/requests', 
      icon: Ticket, 
      label: isRtl ? 'طلباتي والخدمات الذاتية' : 'My Requests & Services', 
      desc: isRtl ? 'تقديم ومتابعة طلبات الإجازات، الدعم الفني، والعهد والموافقات' : 'Submit and track leaves, technical support, and approvals',
      badge: activeRequestsCount > 0 ? (isRtl ? `${activeRequestsCount} نشط` : `${activeRequestsCount} Active`) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { 
      path: '/healthcare', 
      icon: HeartPulse, 
      label: isRtl ? 'الرعاية الصحية والتأمين' : 'Healthcare & Insurance', 
      desc: isRtl ? 'دليل المستشفيات والعيادات، والبطاقة الطبية الرقمية' : 'Hospital directory & digital medical card',
      badge: isRtl ? 'تغطية 100%' : '100% Coverage',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    { 
      path: '/directory', 
      icon: Users, 
      label: isRtl ? 'دليل الزملاء والإدارات' : 'Colleagues & Directory', 
      desc: isRtl ? 'أرقام التواصل والبريد الإلكتروني للفرق والموظفين' : 'Contact numbers and emails for teams and staff' 
    },
    { 
      path: '/profile', 
      icon: FileText, 
      label: isRtl ? 'المستندات والوثائق' : 'Documents & Records', 
      desc: isRtl ? 'الشهادات، بطاقات العمل، والعقود والوثائق الرسمية' : 'Certificates, employee ID, and official documents' 
    },
    { 
      path: '/requests', 
      icon: Briefcase, 
      label: isRtl ? 'الدخول في وضع العمل' : 'Enter Work Mode', 
      desc: isRtl ? 'بيئة مهام فورية، متابعة ساعات العمل، وإنجاز المعاملات' : 'Instant workspace, focus tasks, and daily operations',
      isOrange: true,
      badge: isRtl ? 'وضع العمل' : 'Work Mode',
      badgeColor: 'bg-white text-orange-600'
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[240] lg:hidden"
          />

          {/* Bottom Sheet Drawer with white background and top-to-bottom blue to orange gradient border */}
          <div className="fixed inset-x-0 bottom-0 z-[250] flex justify-center px-2.5 sm:px-4 lg:hidden pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.8 }}
              className="w-full max-w-md sm:max-w-lg max-h-[88vh] p-[3.5px] bg-gradient-to-b from-[#387B9E] via-[#4895B5] via-50% to-orange-500 rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl shadow-slate-950/40 pointer-events-auto flex flex-col overflow-hidden relative"
            >
              {/* Inner White Container */}
              <div className="w-full h-full bg-white/98 backdrop-blur-2xl rounded-t-[24px] sm:rounded-t-[28px] flex flex-col overflow-hidden relative text-slate-900">
                
                {/* Subtle top and bottom ambient highlight accents */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#387B9E]/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none" />

                {/* Grab Handle */}
                <div className="pt-3 pb-1 flex justify-center relative z-10">
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Header: User summary and close button */}
                <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-100 relative z-10">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="size-10 rounded-2xl bg-slate-100 border-2 border-[#387B9E]/30 shadow-xs object-cover"
                    />
                    <div>
                      <h3 className="font-display font-black text-slate-900 text-sm leading-tight">{user.name}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold">{user.role} • {user.department}</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors active:scale-95 border border-slate-200/80"
                    aria-label="Close menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Menu Items Content - Scrollable with safe bottom padding for BottomNav */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-24 sm:pb-28 space-y-3.5 custom-scrollbar text-start rtl:text-right relative z-10">
                  
                  {/* Section Header */}
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
                    {isRtl ? 'الخدمات والإجراءات الذاتية' : 'Self-Services & Requests'}
                  </p>

                  {/* Items list */}
                  <div className="grid grid-cols-1 gap-2">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.path + item.label}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => {
                          if (item.isOrange) {
                            return `
                              flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all font-medium text-xs border
                              bg-gradient-to-r from-accent via-orange-500 to-amber-500 text-white border-orange-300/60 shadow-lg shadow-orange-950/20 hover:brightness-105 active:scale-[0.99]
                            `;
                          }
                          return `
                            flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all font-medium text-xs border
                            ${isActive 
                              ? 'bg-slate-100 text-[#387B9E] font-black border-[#387B9E]/30 shadow-xs' 
                              : 'bg-slate-50/90 hover:bg-slate-100 text-slate-800 border-slate-200/80 shadow-xs'}
                          `;
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.isOrange 
                              ? 'bg-white/20 text-white border border-white/30 shadow-xs' 
                              : 'bg-[#387B9E]/10 text-[#387B9E]'
                          }`}>
                            <item.icon className="size-4 sm:size-4.5" />
                          </div>
                          <div className="min-w-0 text-start rtl:text-right">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-black truncate ${
                                item.isOrange ? 'text-white' : 'text-slate-900'
                              }`}>
                                {item.label}
                              </p>
                              {item.badge && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${item.badgeColor}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] font-semibold truncate ${
                              item.isOrange ? 'text-orange-50/95' : 'text-slate-500'
                            }`}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <ArrowIcon className={`size-4 shrink-0 ${
                          item.isOrange ? 'text-white/90' : 'text-slate-400'
                        }`} />
                      </NavLink>
                    ))}
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

