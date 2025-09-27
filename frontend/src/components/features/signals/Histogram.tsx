import React, { useState } from 'react';
import { CHART_CONFIG } from './constants';
import { HeatmapDatum } from './types';
import { dollarFormatter } from '../../../utils/formatter';
import { formatBN } from '../../../utils/format-bn';
import cn from '../../../utils/cn';

interface HistogramProps {
  priceBins: number[];
  binIndices: number[];
  heatmapData: HeatmapDatum[];
  selectedMarketId: number;
  currentBins: number[];
  setCurrentBins: (bins: number[]) => void;
}

interface HistogramRowProps {
  binIndex: number;
  priceBins: number[];
  marketData: HeatmapDatum;
  totalShares: number;
  selected: boolean;
  maxShare: number;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

function HistogramRow({
  binIndex,
  priceBins,
  marketData,
  totalShares,
  selected,
  maxShare,
  onMouseDown,
  onMouseEnter,
}: HistogramRowProps) {
  const price = priceBins[binIndex];
  const shares = +formatBN(marketData.values[binIndex]);
  const percentage = totalShares > 0 ? (shares / totalShares) * 100 : 0;
  const barWidth = maxShare > 0 ? (shares / maxShare) * 100 : 0;

  return (
    <div
      className={cn(
        "flex items-center py-2 px-3 rounded cursor-pointer transition-colors",
        selected ? "bg-blue-100 border-2 border-blue-500" : "hover:bg-gray-50"
      )}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex-1 text-sm font-medium">
        {dollarFormatter(price)} - {dollarFormatter(price + 500)}
      </div>
      <div className="w-48 pl-4 flex items-center">
        <div className="flex-1 relative">
          <div className="h-6 bg-gray-200 rounded relative overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <span className="text-xs font-medium text-gray-700">
              {shares > 100
                ? shares.toFixed(0)
                : shares > 10
                ? shares.toFixed(1)
                : shares.toFixed(2)}{' '}
              ({percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Histogram = ({
  binIndices,
  priceBins,
  heatmapData,
  selectedMarketId,
  currentBins,
  setCurrentBins,
}: HistogramProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  if (!heatmapData || !heatmapData[selectedMarketId]) return null;
  
  const marketData = heatmapData[selectedMarketId];
  const reversedBinIndices = [...binIndices].reverse();
  
  const totalShares = marketData.values.reduce((sum, value) => sum + +formatBN(value), 0);
  const maxShare = Math.max(...marketData.values.map(value => +formatBN(value)));

  const handleMouseDown = (binIndex: number) => {
    setIsDragging(true);
    if (currentBins.includes(binIndex)) {
      setCurrentBins(currentBins.filter(bin => bin !== binIndex));
    } else {
      setCurrentBins([...currentBins, binIndex]);
    }
  };

  const handleMouseEnter = (binIndex: number) => {
    if (isDragging && !currentBins.includes(binIndex)) {
      setCurrentBins([...currentBins, binIndex]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="w-full"
      style={{ height: CHART_CONFIG.height }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex font-medium text-sm my-2">
        <div className="flex-1">PREDICTION</div>
        <div className="w-48 pl-4">SHARES</div>
      </div>

      <div
        className="space-y-px overflow-y-auto h-[calc(100%-2rem)]"
        style={{ maxHeight: "calc(100% - 2rem)" }}
      >
        {reversedBinIndices.map((binIndex) => {
          return (
            <HistogramRow
              key={binIndex}
              binIndex={binIndex}
              priceBins={priceBins}
              marketData={marketData}
              totalShares={totalShares}
              selected={currentBins.includes(binIndex)}
              maxShare={maxShare}
              onMouseDown={() => handleMouseDown(binIndex)}
              onMouseEnter={() => handleMouseEnter(binIndex)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Histogram;
