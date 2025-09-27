import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Filter } from 'lucide-react';

interface PerformanceData {
  date: string;
  pnl: number;
  cumulativePnl: number;
  trades: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  onTimeRangeChange: (range: string) => void;
}

export function PerformanceChart({ data, onTimeRangeChange }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedRange, setSelectedRange] = useState('7d');
  const [hoveredPoint, setHoveredPoint] = useState<PerformanceData | null>(null);

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  // Simple chart implementation (in a real app, you'd use a proper charting library)
  const renderChart = () => {
    if (!svgRef.current || data.length === 0) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    // Clear previous content
    svg.innerHTML = '';

    // Create SVG element
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());

    // Calculate scales
    const maxPnl = Math.max(...data.map(d => d.cumulativePnl));
    const minPnl = Math.min(...data.map(d => d.cumulativePnl));
    const pnlRange = maxPnl - minPnl;
    const padding = pnlRange * 0.1;

    const xScale = (index: number) => 
      margin.left + (index / (data.length - 1)) * (width - margin.left - margin.right);
    
    const yScale = (value: number) => 
      margin.top + ((maxPnl + padding - value) / (maxPnl - minPnl + 2 * padding)) * (height - margin.top - margin.bottom);

    // Create line path
    const pathData = data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.cumulativePnl);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Add line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', pathData);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#3b82f6');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('class', 'performance-line');
    svg.appendChild(line);

    // Add points
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.cumulativePnl);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#3b82f6');
      circle.setAttribute('class', 'performance-point');
      circle.setAttribute('data-index', index.toString());
      
      // Add hover effects
      circle.addEventListener('mouseenter', () => setHoveredPoint(point));
      circle.addEventListener('mouseleave', () => setHoveredPoint(null));
      
      svg.appendChild(circle);
    });

    // Add axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left.toString());
    xAxis.setAttribute('y1', (height - margin.bottom).toString());
    xAxis.setAttribute('x2', (width - margin.right).toString());
    xAxis.setAttribute('y2', (height - margin.bottom).toString());
    xAxis.setAttribute('stroke', '#e5e7eb');
    xAxis.setAttribute('stroke-width', '1');
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left.toString());
    yAxis.setAttribute('y1', margin.top.toString());
    yAxis.setAttribute('x2', margin.left.toString());
    yAxis.setAttribute('y2', (height - margin.bottom).toString());
    yAxis.setAttribute('stroke', '#e5e7eb');
    yAxis.setAttribute('stroke-width', '1');
    svg.appendChild(yAxis);
  };

  useEffect(() => {
    renderChart();
  }, [data]);

  const handleTimeRangeChange = (range: string) => {
    setSelectedRange(range);
    onTimeRangeChange(range);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Performance Chart
        </h3>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-secondary-600" />
          <select
            value={selectedRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="text-sm border border-secondary-300 dark:border-secondary-600 rounded-lg px-3 py-1 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full h-80"
          viewBox="0 0 800 300"
        />
        
        {/* Tooltip */}
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10"
            style={{
              left: '50%',
              top: '20px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="space-y-1">
              <div className="font-medium">{hoveredPoint.date}</div>
              <div>P&L: {hoveredPoint.pnl >= 0 ? '+' : ''}{hoveredPoint.pnl.toFixed(4)} RBTC</div>
              <div>Cumulative: {hoveredPoint.cumulativePnl.toFixed(4)} RBTC</div>
              <div>Trades: {hoveredPoint.trades}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
          <span className="text-sm text-secondary-600 dark:text-secondary-400">
            Cumulative P&L
          </span>
        </div>
      </div>
    </div>
  );
}
