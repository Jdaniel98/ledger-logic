import { useRef, useState, useMemo } from 'react';
import { scaleLinear, scalePoint } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import styles from './LineChart.module.css';

interface LineDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  fillGradient?: boolean;
}

export function LineChart({
  data,
  width = 500,
  height = 260,
  color = 'var(--color-accent)',
  fillGradient = true,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const gradientId = useMemo(() => `line-grad-${Math.random().toString(36).slice(2, 8)}`, []);

  const margin = { top: 12, right: 12, bottom: 32, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  if (data.length === 0) return null;

  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const domainPad = (maxVal - minVal) * 0.1 || 1;

  const xScale = scalePoint<string>().domain(labels).range([0, innerW]);
  const yScale = scaleLinear()
    .domain([minVal - domainPad, maxVal + domainPad])
    .range([innerH, 0])
    .nice();

  const ticks = yScale.ticks(5);

  const linePath = line<LineDataPoint>()
    .x((d) => xScale(d.label) ?? 0)
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const pathD = linePath(data) ?? '';

  // Area path for gradient fill
  const areaD = pathD
    ? `${pathD}L${xScale(labels[labels.length - 1]) ?? 0},${innerH}L${xScale(labels[0]) ?? 0},${innerH}Z`
    : '';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;

    // Find nearest data point
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const px = xScale(data[i].label) ?? 0;
      const dist = Math.abs(mouseX - px);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }

    const px = (xScale(data[nearest].label) ?? 0) + margin.left;
    const py = yScale(data[nearest].value) + margin.top;
    setTooltip({
      x: px,
      y: py - 8,
      text: `${data[nearest].label}: ${data[nearest].value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    });
  };

  return (
    <div className={styles.container} style={{ width }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {fillGradient && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          )}
        </defs>

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
                {Math.abs(tick) >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {labels.map((label) => (
            <text
              key={label}
              x={xScale(label) ?? 0}
              y={innerH + 20}
              textAnchor="middle"
              fill="var(--color-text-secondary)"
              fontSize={10}
              fontFamily="var(--font-primary)"
            >
              {label}
            </text>
          ))}

          {/* Gradient fill area */}
          {fillGradient && areaD && (
            <path d={areaD} fill={`url(#${gradientId})`} />
          )}

          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth={2} />

          {/* Data points */}
          {data.map((d) => (
            <circle
              key={d.label}
              cx={xScale(d.label) ?? 0}
              cy={yScale(d.value)}
              r={3}
              fill={color}
              stroke="var(--color-bg-white)"
              strokeWidth={1.5}
            />
          ))}

          {/* Hover indicator */}
          {tooltip && (
            <circle
              cx={tooltip.x - margin.left}
              cy={tooltip.y + 8 - margin.top}
              r={5}
              fill={color}
              stroke="var(--color-bg-white)"
              strokeWidth={2}
            />
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
