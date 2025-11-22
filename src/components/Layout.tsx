import React, {useState} from 'react';
import {ChevronLeft, ChevronRight, PanelLeft, PanelRight} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {clsx} from 'clsx';

interface LayoutProps {
    leftSidebar: React.ReactNode;
    center: React.ReactNode;
    rightSidebar: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({leftSidebar, center, rightSidebar}) => {
    const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
    const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            {/* Left Sidebar */}
            <AnimatePresence>
                {leftSidebarVisible && (
                    <motion.aside
                        initial={{x: -320, opacity: 0}}
                        animate={{x: 0, opacity: 1}}
                        exit={{x: -320, opacity: 0}}
                        transition={{duration: 0.3, ease: 'easeInOut'}}
                        className="w-full lg:w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 z-10 flex-shrink-0 h-[30vh] lg:h-screen overflow-y-auto"
                    >
                        {leftSidebar}
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Center Area */}
            <main className="flex-1 relative z-10 flex flex-col h-[40vh] lg:h-screen overflow-hidden">
                {center}
            </main>

            {/* Right Sidebar */}
            <AnimatePresence>
                {rightSidebarVisible && (
                    <motion.aside
                        initial={{x: 320, opacity: 0}}
                        animate={{x: 0, opacity: 1}}
                        exit={{x: 320, opacity: 0}}
                        transition={{duration: 0.3, ease: 'easeInOut'}}
                        className="w-full lg:w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-l border-slate-200 dark:border-slate-700 z-10 flex-shrink-0 h-[30vh] lg:h-screen overflow-y-auto"
                    >
                        {rightSidebar}
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Toggle Buttons */}
            {/* Left Sidebar Toggle */}
            <button
                onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
                className={clsx(
                    "fixed z-30 transition-all duration-300 shadow-lg",
                    leftSidebarVisible
                        ? "hidden lg:flex top-1/2 -translate-y-1/2 left-80 rounded-r-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-y border-r border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800"
                        : "top-4 left-4 lg:top-1/2 lg:-translate-y-1/2 lg:left-0 rounded-lg lg:rounded-r-lg bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700 shadow-xl"
                )}
                aria-label={leftSidebarVisible ? "Hide left sidebar" : "Show left sidebar"}
            >
                <div className="p-2">
                    {leftSidebarVisible ? (
                        <ChevronLeft size={18} />
                    ) : (
                        <PanelLeft size={18} />
                    )}
                </div>
            </button>

            {/* Right Sidebar Toggle */}
            <button
                onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
                className={clsx(
                    "fixed z-30 transition-all duration-300 shadow-lg",
                    rightSidebarVisible
                        ? "hidden lg:flex top-1/2 -translate-y-1/2 right-80 rounded-l-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-y border-l border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800"
                        : "top-4 right-4 lg:top-1/2 lg:-translate-y-1/2 lg:right-0 rounded-lg lg:rounded-l-lg bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700 shadow-xl"
                )}
                aria-label={rightSidebarVisible ? "Hide right sidebar" : "Show right sidebar"}
            >
                <div className="p-2">
                    {rightSidebarVisible ? (
                        <ChevronRight size={18} />
                    ) : (
                        <PanelRight size={18} />
                    )}
                </div>
            </button>
        </div>
    );
};
