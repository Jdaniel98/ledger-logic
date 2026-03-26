import { forwardRef } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(
  function Sparkline({ data, width = 80, height = 24, color = 'var(--color-accent)', className }, ref) {
    if (data.length < 2) {
      return (
        <svg ref={ref} width={width} height={height} className={className}>
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.3}
          />
        </svg>
      );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const chartHeight = height - padding * 2;
    const stepX = width / (data.length - 1);

    const points = data
      .map((val, i) => {
        const x = i * stepX;
        const y = padding + chartHeight - ((val - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg ref={ref} width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  },
);
