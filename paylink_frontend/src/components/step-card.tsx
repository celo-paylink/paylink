import type { LucideIcon } from 'lucide-react';

interface StepCardProps {
    stepNumber: number;
    title: string;
    description: string;
    icon: LucideIcon;
    gradientFrom: string;
    gradientTo: string;
    diagonalOffset: number; // Offset in rem units (e.g., 0, 4, 8, 16, etc.)
}

export default function StepCard({
    stepNumber,
    title,
    description,
    icon: Icon,
    gradientFrom,
    gradientTo,
    diagonalOffset
}: StepCardProps) {
    return (
        <div
            className="glass-card text-center group w-full md:w-80 max-w-sm mx-auto md:mx-0"
            style={{
                // Only apply diagonal offset on medium screens and above
                transform: window.innerWidth >= 768 ? `translateY(${diagonalOffset}rem)` : 'none'
            }}
        >
            {/* Icon Circle */}
            <div
                className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform"
                style={{
                    background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`
                }}
            >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            {/* Step Number Badge */}
            <div className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--accent-primary)] text-black font-bold text-xs sm:text-sm mb-2 sm:mb-3">
                {stepNumber}
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 px-2">{title}</h3>

            {/* Description */}
            <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed px-3 sm:px-4">
                {description}
            </p>
        </div>
    );
}
