import { useRef, useEffect, useState } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import styles from './BarChart.module.css';

interface BarValue {
  key: string;
  value: number;
  color: string;
}

interface BarGroup {
  label: string;
  values: BarValue[];
}

interface BarChartProps {
  data: BarGroup[];
  width?: number;
  height?: number;
}

export function BarChart({ data, width = 500, height = 280 }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const margin = { top: 12, right: 12, bottom: 32, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const labels = data.map((d) => d.label);
  const allValues = data.flatMap((d) => d.values.map((v) => v.value));
  const maxVal = Math.max(...allValues, 1);

  const xScale = scaleBand().domain(labels).range([0, innerW]).padding(0.3);
  const subKeys = data[0]?.values.map((v) => v.key) ?? [];
  const xSub = scaleBand().domain(subKeys).range([0, xScale.bandwidth()]).padding(0.08);
  const yScale = scaleLinear().domain([0, maxVal]).range([innerH, 0]).nice();

  const ticks = yScale.ticks(5);

  return (
    <div className={styles.container} style={{ width }}>
      <svg ref={svgRef} width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Y-axis grid lines */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={0}
                x2={innerW}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="var(--color-bg-card-2)"
                strokeDasharray="2,2"
              />
              <text
                x={-8}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--color-text-secondary)"
                fontSize={10}
                fontFamily="var(--font-primary)"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {labels.map((label) => (
            <text
              key={label}
              x={(xScale(label) ?? 0) + xScale.bandwidth() / 2}
              y={innerH + 20}
              textAnchor="middle"
              fill="var(--color-text-secondary)"
              fontSize={10}
              fontFamily="var(--font-primary)"
            >
              {label}
            </text>
          ))}

          {/* Bars */}
          {data.map((group) =>
            group.values.map((v) => {
              const x = (xScale(group.label) ?? 0) + (xSub(v.key) ?? 0);
              const barHeight = innerH - yScale(v.value);
              const y = yScale(v.value);

              return (
                <rect
                  key={`${group.label}-${v.key}`}
                  x={x}
                  y={y}
                  width={xSub.bandwidth()}
                  height={Math.max(barHeight, 0)}
                  fill={v.color}
                  rx={2}
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGRectElement).getBoundingClientRect();
                    const container = svgRef.current?.getBoundingClientRect();
                    if (container) {
                      setTooltip({
                        x: rect.x - container.x + rect.width / 2,
                        y: rect.y - container.y - 8,
                        text: `${v.key}: ${v.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'default' }}
                />
              );
            }),
          )}
        </g>
      </svg>

      <div
        className={styles.tooltip}
        data-visible={tooltip ? true : undefined}
        style={tooltip ? { left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' } : undefined}
      >
        {tooltip?.text}
      </div>
    </div>
  );
}
