import { useState, useEffect, useMemo } from 'react';
import BN from 'bn.js';
import { useMetamaskWallet } from '../../../web3/MetamaskWalletProvider';
import { HeatmapDatum } from './types';

export function usePredictionInput(
  dateBase: Date,
  priceBase: number,
  binCount: number,
  priceStep: number
) {
  const { balance } = useMetamaskWallet();
  const [isHeatmap, setIsHeatmap] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dateBase);
  const [currentBins, setCurrentBins] = useState<number[]>([]);
  const [cost, setCost] = useState('0.1');
  const [isTicketLoading, setIsTicketLoading] = useState(false);

  // Generate mock data
  const heatmapData = useMemo(() => {
    const data: HeatmapDatum[] = [];
    const today = new Date();
    
    for (let i = -7; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const values = Array.from({ length: binCount }, () => {
        // Generate random BN values for shares
        const randomValue = Math.floor(Math.random() * 1000000);
        return new BN(randomValue);
      });
      
      data.push({
        date: date.toISOString(),
        values,
        state: i < 0 ? 'closed' : i === 0 ? 'today' : 'open'
      });
    }
    
    return data;
  }, [binCount]);

  const priceBins = useMemo(() => {
    return Array.from({ length: binCount }, (_, i) => priceBase + i * priceStep);
  }, [priceBase, binCount, priceStep]);

  const binIndices = useMemo(() => {
    return Array.from({ length: binCount }, (_, i) => i);
  }, [binCount]);

  const selectedMarketId = useMemo(() => {
    // Find the market index for the selected date
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const marketIndex = heatmapData.findIndex(d => 
      d.date.split('T')[0] === selectedDateStr
    );
    return marketIndex >= 0 ? marketIndex : 0;
  }, [selectedDate, heatmapData]);

  const currRange: [number, number] | null = useMemo(() => {
    if (currentBins.length === 0) return null;
    const minBin = Math.min(...currentBins);
    const maxBin = Math.max(...currentBins);
    return [priceBins[minBin], priceBins[maxBin] + priceStep];
  }, [currentBins, priceBins, priceStep]);

  const shares = useMemo(() => {
    if (currentBins.length === 0 || !cost) return new BN(0);
    // Mock calculation - in real app this would use proper market math
    const costBN = new BN(Math.floor(parseFloat(cost) * 1000000));
    return costBN.mul(new BN(currentBins.length));
  }, [currentBins, cost]);

  const onBinClick = (dateIndex: number, priceIndex: number) => {
    // Update selected date based on clicked date
    const clickedDate = new Date(heatmapData[dateIndex].date);
    setSelectedDate(clickedDate);
    
    // Toggle bin selection
    if (currentBins.includes(priceIndex)) {
      setCurrentBins(currentBins.filter(bin => bin !== priceIndex));
    } else {
      setCurrentBins([...currentBins, priceIndex]);
    }
  };

  const refreshMap = async () => {
    setIsTicketLoading(true);
    // Mock refresh - in real app this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsTicketLoading(false);
  };

  return {
    isHeatmap,
    setIsHeatmap,
    selectedDate,
    setSelectedDate,
    selectedMarketId,
    currentBins,
    setCurrentBins,
    currRange,
    binIndices,
    cost,
    setCost,
    heatmapData,
    priceBins,
    onBinClick,
    shares,
    balance: parseFloat(balance),
    isTicketLoading,
    refreshMap,
  };
}
