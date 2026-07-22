import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface LoginBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginBottomSheet({ isOpen, onClose, message = 'سجل دخولك لإكمال الطلب' }: LoginBottomSheetProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-surface-900 rounded-t-3xl px-6 pb-10 pt-4 shadow-2xl"
          >
            <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600 mx-auto mb-6" />
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center">
                <Lock size={28} className="text-accent-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">{message}</h3>
                <p className="text-sm text-surface-500 mt-1">سجل دخولك للوصول إلى جميع المميزات</p>
              </div>
              <div className="w-full space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full py-3.5 rounded-2xl font-bold bg-accent-500 hover:bg-accent-600 text-white transition-all active:scale-[0.98]"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all active:scale-[0.98]"
                >
                  المتابعة لاحقاً
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
