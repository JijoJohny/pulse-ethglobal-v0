import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CHART_CONFIG } from './constants';
import { HeatmapChartProps, BinItem } from './types';
import { dollarFormatter } from '../../../utils/formatter';
import { formatBN } from '../../../utils/format-bn';

const colorScale = (value: number, isClosed: boolean = false) => {
  if (isClosed) {
    return 'fill-gray-100 stroke-gray-200';
  }
  
  if (value === 0) return 'fill-gray-50 stroke-gray-200';
  if (value < 0.2) return 'fill-blue-100 stroke-blue-200';
  if (value < 0.4) return 'fill-blue-200 stroke-blue-300';
  if (value < 0.6) return 'fill-blue-300 stroke-blue-400';
  if (value < 0.8) return 'fill-blue-400 stroke-blue-500';
  return 'fill-blue-500 stroke-blue-600';
};

export default function HeatmapChart({
  data,
  priceBins,
  margin = CHART_CONFIG.margin,
  onBinClick,
}: HeatmapChartProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredBin, setHoveredBin] = useState<BinItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const newWidth = containerRef.current?.parentElement?.clientWidth ?? 0;
      setContainerWidth(newWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current.parentElement!);

    return () => resizeObserver.disconnect();
  }, []);

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
    .range([margin.left, containerWidth - margin.right]);

  const yScale = d3
    .scaleBand()
    .domain(priceBins.map(String))
    .range([CHART_CONFIG.height - margin.bottom, margin.top]);

  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(6)
            .tickSize(0)
            .tickFormat((d) => d3.timeFormat("%b %-d")(d as Date))
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g.selectAll(".tick text").attr("dy", "1em").style("font-size", "12px")
        );
    }
  }, [xScale]);

  useEffect(() => {
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(0)
            .tickValues(
              yScale
                .domain()
                .filter(
                  (_, i) => i % Math.ceil(yScale.domain().length / 8) === 0
                )
            )
            .tickFormat((d) => {
              const num = parseFloat(d as string);
              return dollarFormatter(num);
            })
        )
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick text").style("font-size", "12px"));
    }
  }, [yScale]);

  // Calculate normalized data for color scaling
  const normalizedData = data.map((d) => {
    const sum = d.values.reduce((acc, value) => acc + +formatBN(value), 0);
    return sum > 0
      ? d.values.map((value) => +formatBN(value) / sum)
      : d.values.map(() => 0);
  });
  const maxValue = Math.max(...normalizedData.flat());
  const scaledData = normalizedData.map((d) =>
    d.map((value) => (maxValue > 0 ? value / maxValue : 0))
  );

  const cellPadding = 1;
  const horizontalPadding = 1;
  const rectWidth =
    containerWidth > 0
      ? (containerWidth - margin.left - margin.right) / data.length -
        horizontalPadding
      : 0;
  const rectHeight = yScale.bandwidth() - cellPadding;

  return (
    <div className="relative flex-1">
      <svg
        ref={containerRef}
        width="100%"
        height={CHART_CONFIG.height}
        viewBox={`0 0 ${containerWidth} ${CHART_CONFIG.height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredBin(null)}
      >
        <g
          ref={xAxisRef}
          transform={`translate(0,${CHART_CONFIG.height - margin.bottom})`}
        />
        <g ref={yAxisRef} transform={`translate(${margin.left},0)`} />

        {/* Background rectangles */}
        {data.map((d, i) => {
          const date = new Date(d.date);
          return priceBins.map((_, j) => (
            <rect
              key={`bg-${i}-${j}`}
              x={xScale(date)}
              y={yScale(priceBins[j].toString())!}
              width={rectWidth + horizontalPadding}
              height={yScale.bandwidth()}
              className={
                d.state === "closed"
                  ? "fill-gray-50 stroke-gray-100"
                  : "fill-white stroke-gray-200"
              }
            />
          ));
        })}

        {/* Heatmap cells */}
        {data.map((d, i) => {
          const date = new Date(d.date);
          const scaledValues = scaledData[i];
          const ticketSum = d.values.reduce(
            (acc, value) => acc + +formatBN(value),
            0
          );
          return scaledValues.map((value, j) => (
            <rect
              key={`${i}-${j}`}
              onClick={() => onBinClick(i, j)}
              x={xScale(date)}
              y={yScale(priceBins[j].toString())! + cellPadding / 2}
              width={rectWidth}
              height={rectHeight}
              className={`${colorScale(value, d.state === "closed")} ${
                j === hoveredBin?.j &&
                i === hoveredBin?.i &&
                "stroke-orange-500 stroke-2"
              } cursor-pointer`}
              onMouseEnter={() => {
                setHoveredBin({
                  i,
                  j,
                  date,
                  price: priceBins[j].toString(),
                  tickets: +formatBN(d.values[j]),
                  perc: (100 * +formatBN(d.values[j])) / ticketSum,
                });
              }}
            />
          ));
        })}
      </svg>

      {hoveredBin && (
        <div
          className="absolute space-y-2 w-48 bg-white text-neutral-900 px-4 py-3 rounded-lg shadow-lg pointer-events-none z-10 border"
          style={{
            left: xScale(hoveredBin.date) + rectWidth / 2,
            top: yScale(hoveredBin.price)! - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex justify-between">
            <p className="text-xs text-neutral-500">Date</p>
            <p className="text-sm font-bold text-neutral-900">
              {d3.timeFormat("%-d %b %Y")(hoveredBin.date)}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-neutral-500">Price</p>
            <p className="text-sm font-bold">
              {dollarFormatter(hoveredBin.price)}-
              {dollarFormatter(+hoveredBin.price + 500)}
            </p>
          </div>

          <hr className="border-neutral-200" />
          <div className="flex justify-between">
            <p className="text-xs text-neutral-500">Shares</p>
            <p className="text-sm font-bold">
              {hoveredBin.tickets > 100
                ? hoveredBin.tickets.toFixed(0)
                : hoveredBin.tickets > 10
                ? hoveredBin.tickets.toFixed(1)
                : hoveredBin.tickets.toFixed(2)}{" "}
              ({hoveredBin.perc.toFixed(2)}%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
