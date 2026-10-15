import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Search, Filter, Loader2, Inbox, PlayCircle, CheckCircle2, XCircle, AlertCircle, Clock, MessageSquare, Plus, Check } from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: string;
  createdAt: string;
  creator: {
    name: string;
    avatarUrl: string | null;
  };
}

const COLUMNS = [
  { id: 'PENDING', label: 'طلبات جديدة', icon: Inbox, color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
  { id: 'IN_PROGRESS', label: 'قيد المعالجة', icon: PlayCircle, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  { id: 'COMPLETED', label: 'مكتملة', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  { id: 'CANCELLED', label: 'مرفوضة', icon: XCircle, color: 'bg-rose-100 text-rose-700', border: 'border-rose-200' }
];

export default function FunctionalRequestsManager() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<{ department?: string; isGlobalView?: boolean } | null>(null);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('litc_token'); // ✅ Fix: use correct token key
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/functional/admin/requests', {
        headers,
        credentials: 'include' // ✅ Send HttpOnly cookie
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
        setMetadata(data.metadata || null);
      } else {
        console.error('[FunctionalRequestsManager] API error:', data.error);
      }
    } catch (err) {
      console.error('[FunctionalRequestsManager] fetchTickets failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const ticketId = parseInt(draggableId);
    const newStatus = destination.droppableId as Ticket['status'];

    // Optimistic UI update
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    setUpdating(ticketId);

    try {
      const token = localStorage.getItem('litc_token'); // ✅ Fix: use correct token key
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const note = prompt('أضف ملاحظة للموظف (اختياري):');
      
      await fetch(`/api/v1/functional/admin/requests/${ticketId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include', // ✅ Send HttpOnly cookie
        body: JSON.stringify({ status: newStatus, note })
      });
    } catch (err) {
      console.error('[FunctionalRequestsManager] Status update failed:', err);
      // Revert on failure
      fetchTickets();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rtl:text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">معالجة طلبات الموظفين</h2>
            {metadata?.isGlobalView ? (
              <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black tracking-widest uppercase">SUPER ADMIN - جميع الإدارات</span>
            ) : metadata?.department ? (
              <span className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-[10px] font-black tracking-widest uppercase">نطاق: {metadata.department}</span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-slate-500">لوحة تفاعلية لإدارة مسار الطلبات (سحب وإفلات)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="بحث برقم الطلب..." className="ps-10 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold w-64 shadow-sm" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          </div>
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            <Filter className="size-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar h-[calc(100vh-200px)]">
          {COLUMNS.map(col => {
            const colTickets = tickets.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[320px] flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 p-4">
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`size-8 rounded-xl flex items-center justify-center ${col.color} border ${col.border}`}>
                      <col.icon className="size-4" />
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-200">{col.label}</h3>
                  </div>
                  <span className="text-xs font-black bg-white dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500 shadow-sm">
                    {colTickets.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-3 p-1 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''}`}
                    >
                      {colTickets.map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all ${snapshot.isDragging ? 'shadow-xl scale-[1.02] rotate-1 z-50' : ''} ${updating === ticket.id ? 'opacity-50 pointer-events-none' : ''}`}
                              style={provided.draggableProps.style}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                                  #{ticket.id}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <Clock className="size-3" />
                                  {new Date(ticket.createdAt).toLocaleDateString('ar-LY')}
                                </div>
                              </div>
                              
                              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 leading-tight">
                                {ticket.title}
                              </h4>
                              
                              <p className="text-xs font-semibold text-slate-500 line-clamp-2 mb-4">
                                {ticket.description}
                              </p>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2">
                                  {ticket.creator?.avatarUrl ? (
                                    <img src={ticket.creator.avatarUrl} alt="Avatar" className="size-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">
                                      {ticket.creator?.name?.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {ticket.creator?.name}
                                  </span>
                                </div>
                                
                                {updating === ticket.id && <Loader2 className="size-3.5 animate-spin text-accent" />}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
