"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { HiXMark } from "react-icons/hi2";
import { FiRotateCcw } from "react-icons/fi";

type NotodolistsVariant = "default" | "success" | "error";

type NotodolistsProps = {
    title: string;
    description: string;
    isOpen: boolean;
    variant?: NotodolistsVariant;
    durationMs?: number;
    onUndo?: () => void;
    undoLabel?: string;
    onClose: () => void;
};

const Notodolists: React.FC<NotodolistsProps> = ({
    title,
    description,
    isOpen,
    variant = "default",
    durationMs = 3500,
    onUndo,
    undoLabel = "Undo",
    onClose,
}) => {
    const [visible, setVisible] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen) {
            setVisible(false);
            return;
        }

        setVisible(true);
        const timer = window.setTimeout(() => {
            setVisible(false);
            onClose();
        }, durationMs);

        return () => window.clearTimeout(timer);
    }, [isOpen, durationMs, onClose]);

    const toneClass =
        variant === "success"
            ? "border-[var(--accent-green)] bg-[var(--accent-green)]/20"
            : variant === "error"
            ? "border-[var(--accent-red)] bg-[var(--accent-red)]/20"
            : "border-[var(--accent-blue)] bg-[var(--accent-blue)]/20";

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: -90, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -80, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[250] w-[92%] max-w-xl"
                >
                    <div className={clsx("relative rounded-4xl border-2 shadow-2xl backdrop-blur-md px-5 py-4", toneClass)}>
                        <button
                            type="button"
                            className="absolute right-3 top-3 p-1 rounded-full hover:bg-black/10 cursor-pointer"
                            onClick={() => {
                                setVisible(false);
                                onClose();
                            }}
                            aria-label="Close notification"
                        >
                            <HiXMark className="text-lg" />
                        </button>

                        <h3 className="text-center font-bold text-lg leading-tight pr-8 pl-8">
                            {title}
                        </h3>
                        <p className="mt-2 text-center text-sm opacity-90 break-words">
                            {description}
                        </p>
                        {onUndo &&
                            <div className="mt-3 flex justify-center">
                                <button
                                    type="button"
                                    className="cursor-pointer text-sm font-semibold px-3 py-1 rounded-full border border-current hover:bg-black/10 inline-flex items-center gap-1.5"
                                    onClick={() => {
                                        onUndo();
                                        setVisible(false);
                                        onClose();
                                    }}
                                >
                                    <FiRotateCcw className="text-sm" />
                                    {undoLabel}
                                </button>
                            </div>
                        }
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Notodolists;
