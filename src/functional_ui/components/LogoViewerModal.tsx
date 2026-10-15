import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import nexusLogo from "../assets/images/nexus_intelligent_space_logo_1788129957614.jpg";

interface LogoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoViewerModal({ isOpen, onClose }: LogoViewerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto border border-white/10"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="size-5" />
              </button>
              
              <div className="p-8 flex flex-col items-center justify-center">
                <img
                  src={nexusLogo}
                  alt="Nexus Logo"
                  className="w-full h-auto max-h-[60vh] object-contain rounded-xl shadow-2xl"
                />
                
                <div className="mt-8 text-center">
                  <h3 className="text-2xl font-black text-orange-500 tracking-widest uppercase mb-2">
                    Nexus Intelligent Space
                  </h3>
                  
                  <a
                    href={nexusLogo}
                    download="Nexus_Logo.jpg"
                    className="inline-flex items-center gap-2 px-6 py-3 mt-4 rounded-xl bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-colors font-bold border border-orange-500/30"
                  >
                    <Download className="size-5" />
                    <span>تنزيل الشعار</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LogoViewerModal;
