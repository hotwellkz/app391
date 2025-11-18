import React from 'react';

interface EstimateTooltipProps {
  content: string;
  show: boolean;
}

export const EstimateTooltip: React.FC<EstimateTooltipProps> = ({ content, show }) => {
  if (!show) return null;

  return (
    <div 
      className="absolute z-50 p-4 sm:p-6 bg-emerald-50 border border-emerald-200 rounded-lg shadow-xl 
        w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[400px] sm:max-w-[600px]
        left-1/2 sm:left-auto right-auto sm:right-0 -translate-x-1/2 sm:translate-x-0"
      style={{
        top: 'calc(100% + 10px)',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}
    >
      <pre className="text-xs sm:text-sm text-emerald-700 whitespace-pre-wrap font-sans break-words">{content}</pre>
    </div>
  );
}; 