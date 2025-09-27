import React from 'react';

interface ToggleChartSwitchProps {
  isHeatmap: boolean;
  setIsHeatmap: (value: boolean) => void;
}

export default function ToggleChartSwitch({ isHeatmap, setIsHeatmap }: ToggleChartSwitchProps) {
  return (
    <div className="flex bg-neutral-100 rounded-lg p-1">
      <button
        onClick={() => setIsHeatmap(true)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          isHeatmap
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        🔥 Heatmap
      </button>
      <button
        onClick={() => setIsHeatmap(false)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          !isHeatmap
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        📊 Histogram
      </button>
    </div>
  );
}
