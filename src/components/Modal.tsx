import React from "react";
import { motion, AnimatePresence } from "motion/react";


export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
    isOpen?: boolean;
    onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen = false, onClose, children, ...rest }) => {
    return (
        <AnimatePresence>
            {isOpen && 
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-underPage)]/20 bg-opacity-50 backdrop-blur-lg"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[var(--bg-control)]/70 backdrop-blur-xl p-6 rounded-2xl w-[30%] "
                    >
                        {children}
                    </div>
                </motion.div>
            }
        </AnimatePresence>
    );
};

export default Modal;