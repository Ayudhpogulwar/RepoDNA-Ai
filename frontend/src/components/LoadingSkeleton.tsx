import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 4, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-6 bg-slate-800 rounded w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-4 bg-slate-800 rounded w-full" style={{ opacity: 1 - idx * 0.15 }}></div>
        ))}
      </div>
    </div>
  );
};
export default LoadingSkeleton;
