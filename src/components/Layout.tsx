import React from 'react';


interface LayoutProps {
    leftSidebar: React.ReactNode;
    center: React.ReactNode;
    rightSidebar: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({leftSidebar, center, rightSidebar}) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            {/* Left Sidebar */}
            <aside className="w-full lg:w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 z-10 flex-shrink-0 h-[30vh] lg:h-screen overflow-y-auto">
                {leftSidebar}
            </aside>

            {/* Center Area */}
            <main className="flex-1 relative z-10 flex flex-col h-[40vh] lg:h-screen overflow-hidden">
                {center}
            </main>

            {/* Right Sidebar */}
            <aside className="w-full lg:w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-l border-slate-200 dark:border-slate-700 z-10 flex-shrink-0 h-[30vh] lg:h-screen overflow-y-auto">
                {rightSidebar}
            </aside>
        </div>
    );
};
