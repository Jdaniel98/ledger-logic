import { useRef, useState } from 'react';
import { arc as d3Arc, pie as d3Pie } from 'd3-shape';
import styles from './DonutChart.module.css';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function DonutChart({ data, size = 200, centerLabel, centerSub }: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const outerRadius = size / 2 - 4;
  const innerRadius = outerRadius * 0.6;
  const center = size / 2;

  const pieGen = d3Pie<DonutSlice>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.02);

  const arcGen = d3Arc<{ startAngle: number; endAngle: number }>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(3);

  const arcs = pieGen(data);

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg ref={svgRef} width={size} height={size}>
        <g transform={`translate(${center},${center})`}>
          {arcs.map((arcData, i) => (
            <path
              key={data[i].label}
              d={arcGen(arcData) ?? ''}
              fill={data[i].color}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGPathElement).getBoundingClientRect();
                const container = svgRef.current?.getBoundingClientRect();
                if (container) {
                  setTooltip({
                    x: rect.x - container.x + rect.width / 2,
                    y: rect.y - container.y - 4,
                    text: `${data[i].label}: ${data[i].value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'default' }}
            />
          ))}
        </g>
      </svg>

      <div className={styles.centerLabel}>
        {centerLabel && <span className={styles.centerAmount}>{centerLabel}</span>}
        {centerSub && <span className={styles.centerSub}>{centerSub}</span>}
      </div>

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
