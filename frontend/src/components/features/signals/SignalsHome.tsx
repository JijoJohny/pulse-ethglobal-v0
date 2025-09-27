import React from 'react';
import HeatmapChart from './HeatmapChart';
import ToggleChartSwitch from './ToggleChartSwitch';
import { DatePickerItem } from './DatePickerItem';
import Histogram from './Histogram';
import PredictionInput from './PredictionInput';
import { PREDICTION_CONSTANTS } from './constants';
import { usePredictionInput } from './usePredictionInput';

export default function SignalsHome() {
  const {
    isHeatmap, setIsHeatmap,
    selectedDate, setSelectedDate,
    selectedMarketId,
    currentBins, setCurrentBins, currRange, binIndices,
    cost, setCost,
    heatmapData,
    priceBins,
    onBinClick,
    shares,
    balance,
    isTicketLoading,
    refreshMap,
  } = usePredictionInput(
    PREDICTION_CONSTANTS.dateBase,
    PREDICTION_CONSTANTS.priceBase,
    PREDICTION_CONSTANTS.binCount,
    PREDICTION_CONSTANTS.priceStep
  );

  return (
    <div className="flex flex-col gap-2 py-9">
      <div className="flex gap-2">
        <ToggleChartSwitch isHeatmap={isHeatmap} setIsHeatmap={setIsHeatmap} />
        <DatePickerItem
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>

      <div className="flex gap-12">
        <div className="flex flex-[2.5]">
          {heatmapData &&
            (isHeatmap ? (
              <HeatmapChart
                data={heatmapData}
                priceBins={priceBins}
                onBinClick={onBinClick}
              />
            ) : (
              <Histogram
                binIndices={binIndices}
                priceBins={priceBins}
                heatmapData={heatmapData}
                selectedMarketId={selectedMarketId}
                currentBins={currentBins}
                setCurrentBins={setCurrentBins}
              />
            ))}
        </div>
        <div className="min-w-[340px]">
          <PredictionInput
            shares={shares}
            selectedMarketId={selectedMarketId}
            currentBins={currentBins}
            selectedDate={selectedDate}
            currRange={currRange}
            cost={cost}
            setCost={setCost}
            balance={balance}
            isTicketLoading={isTicketLoading}
            refreshMap={refreshMap}
          />
        </div>
      </div>
    </div>
  );
}
