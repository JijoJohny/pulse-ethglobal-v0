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
  const min = priceBins[binIndex];
  const max = priceBins[binIndex + 1] || priceBins[binIndex] + 500;
  const shareValue = +formatBN(marketData.values[binIndex]);
  const share = totalShares > 0 ? (shareValue / totalShares) * 100 : 0;

  return (
    <div
      key={binIndex}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex h-10 cursor-pointer",
        selected
          ? "bg-bitcoin/20"
          : "group hover:bg-primary-50 hover:bg-opacity-50"
      )}
    >
      <div className="flex-1 relative w-full">
        <div
          className={cn(
            "font-medium h-full transition-all duration-300 ease-in-out",
            selected
              ? "bg-bitcoin opacity-100"
              : "bg-primary-200 opacity-50 group-hover:bg-primary-200 group-hover:opacity-100"
          )}
          style={{
            width: `${maxShare > 0 ? (100 * shareValue) / maxShare : 0}%`,
          }}
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center pl-4 select-none",
            selected
              ? "text-black font-bold"
              : "text-neutral-400 group-hover:text-neutral-800 group-hover:font-bold"
          )}
        >
          ${min.toLocaleString()} ~ ${max.toLocaleString()}
        </div>
      </div>
      <div className="flex items-center w-48 pl-4 select-none">
        <p
          className={
            selected
              ? "text-black font-bold"
              : "text-neutral-400 group-hover:text-neutral-800 group-hover:font-bold"
          }
        >
          {share.toFixed(1)}% ({shareValue.toFixed(2)})
        </p>
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
