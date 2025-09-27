import BN from "bn.js";

export interface HeatmapDatum {
  date: string;
  values: BN[];
  state: "open" | "closed" | "today";
}

export interface BinItem {
  i: number;
  j: number;
  date: Date;
  price: string;
  tickets: number;
  perc: number;
}

export interface HeatmapChartProps {
  data: HeatmapDatum[];
  priceBins: number[];
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  onBinClick: (dateIndex: number, priceIndex: number) => void;
}

export interface PredictionInputProps {
  shares: BN;
  selectedMarketId: number;
  currentBins: number[];
  selectedDate: Date;
  currRange: [number, number];
  cost: string;
  setCost: (amount: string) => void;
  balance: number;
  isTicketLoading: boolean;
  refreshMap: () => Promise<void>;
  heatmapData?: HeatmapDatum[];
}
