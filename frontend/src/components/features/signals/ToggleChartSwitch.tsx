import React from 'react';

interface ToggleChartSwitchProps {
  isHeatmap: boolean;
  setIsHeatmap: (value: boolean) => void;
}

export default function ToggleChartSwitch({ isHeatmap, setIsHeatmap }: ToggleChartSwitchProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setIsHeatmap(true)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isHeatmap
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Heatmap
      </button>
      <button
        onClick={() => setIsHeatmap(false)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          !isHeatmap
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Histogram
      </button>
    </div>
  );
}
