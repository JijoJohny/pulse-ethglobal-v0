import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface HeatmapData {
  date: string;
  price: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  width?: number;
  height?: number;
  onBinSelect?: (bins: number[]) => void;
  selectedBins?: number[];
  isClosed?: boolean;
}

const CHART_CONFIG = {
  height: 400,
  margin: { top: 20, right: 20, bottom: 40, left: 60 },
  cellSize: 20,
  cellPadding: 2,
};

export function HeatmapChart({ 
  data, 
  width = 800, 
  height = CHART_CONFIG.height,
  onBinSelect,
  selectedBins = [],
  isClosed = false
}: HeatmapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  // Process data for heatmap
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group data by date and price
    const grouped = data.reduce((acc, item) => {
      const key = `${item.date}-${item.price}`;
      if (!acc[key]) {
        acc[key] = { date: item.date, price: item.price, value: 0 };
      }
      acc[key].value += item.value;
      return acc;
    }, {} as Record<string, HeatmapData>);

    return Object.values(grouped);
  }, [data]);

  // Create scales
  const xScale = d3.scaleBand()
    .domain(processedData.map(d => d.date).filter((d, i, arr) => arr.indexOf(d) === i))
    .range([0, width - CHART_CONFIG.margin.left - CHART_CONFIG.margin.right])
    .padding(0.1);

  const yScale = d3.scaleBand()
    .domain(processedData.map(d => d.price.toString()).filter((d, i, arr) => arr.indexOf(d) === i))
    .range([0, height - CHART_CONFIG.margin.top - CHART_CONFIG.margin.bottom])
    .padding(0.1);

  const colorScale = d3.scaleSequential()
    .domain([0, d3.max(processedData, d => d.value) || 1])
    .interpolator(d3.interpolateBlues);

  // Handle cell click
  const handleCellClick = (d: HeatmapData) => {
    if (isClosed) return;
    
    const binIndex = processedData.findIndex(item => 
      item.date === d.date && item.price === d.price
    );
    
    if (onBinSelect) {
      const newSelectedBins = selectedBins.includes(binIndex)
        ? selectedBins.filter(i => i !== binIndex)
        : [...selectedBins, binIndex];
      onBinSelect(newSelectedBins);
    }
  };

  // Handle cell hover
  const handleCellHover = (event: React.MouseEvent, d: HeatmapData) => {
    if (isClosed) return;
    
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: `Date: ${d.date}\nPrice: $${d.price}\nValue: ${d.value.toFixed(2)}`
    });
  };

  const handleCellLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Render heatmap
  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${CHART_CONFIG.margin.left}, ${CHART_CONFIG.margin.top})`);

    // Add cells
    const cells = g.selectAll('.cell')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.date) || 0)
      .attr('y', d => yScale(d.price.toString()) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => isClosed ? '#e5e7eb' : colorScale(d.value))
      .attr('stroke', d => {
        const binIndex = processedData.findIndex(item => 
          item.date === d.date && item.price === d.price
        );
        return selectedBins.includes(binIndex) ? '#3b82f6' : '#e5e7eb';
      })
      .attr('stroke-width', d => {
        const binIndex = processedData.findIndex(item => 
          item.date === d.date && item.price === d.price
        );
        return selectedBins.includes(binIndex) ? 2 : 1;
      })
      .style('cursor', isClosed ? 'default' : 'pointer')
      .on('click', (event, d) => handleCellClick(d))
      .on('mouseover', (event, d) => handleCellHover(event, d))
      .on('mouseout', handleCellLeave);

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%m/%d'));
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `$${d}`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - CHART_CONFIG.margin.top - CHART_CONFIG.margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6b7280');

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6b7280');

    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', (width - CHART_CONFIG.margin.left - CHART_CONFIG.margin.right) / 2)
      .attr('y', height - CHART_CONFIG.margin.bottom + 20)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('Date');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height - CHART_CONFIG.margin.top - CHART_CONFIG.margin.bottom) / 2)
      .attr('y', -40)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('Price ($)');

  }, [processedData, selectedBins, isClosed, width, height, xScale, yScale, colorScale]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-auto"
      />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute z-10 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <pre className="whitespace-pre-wrap">{tooltip.content}</pre>
        </motion.div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-sm text-gray-600">Low</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Medium</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-900 rounded"></div>
          <span className="text-sm text-gray-600">High</span>
        </div>
      </div>
    </div>
  );
}
