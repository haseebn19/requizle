import React from 'react';
import {BookOpen} from 'lucide-react';

interface Props {
    size?: number;
    className?: string;
}

export const Logo: React.FC<Props> = ({size = 24, className = ''}) => {
    // Calculate inner icon size (about 60% of container)
    const iconSize = Math.round(size * 0.55);
    const padding = Math.round(size * 0.2);

    return (
        <div
            className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 ${className}`}
            style={{
                width: size,
                height: size,
                padding: padding
            }}
        >
            <BookOpen size={iconSize} className="text-white" strokeWidth={2.5} />
        </div>
    );
};
