import { useRef, useEffect } from 'react';
import { arc as d3Arc } from 'd3-shape';
import { select } from 'd3-selection';
import { interpolate } from 'd3-interpolate';
import 'd3-transition';
import type { CategorySpending } from '../../shared/types/models';
import styles from './BudgetRing.module.css';

interface BudgetRingProps {
  categories: CategorySpending[];
  size?: number;
}

const RING_WIDTH = 10;
const RING_GAP = 3;
const MUTED_OPACITY = 0.15;
const ANIMATION_DURATION = 600;

const DEFAULT_COLORS = [
  'var(--color-accent)',
  'var(--color-danger)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-income)',
];

export function BudgetRing({ categories, size = 200 }: BudgetRingProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimated = useRef(false);

  const totalAllocated = categories.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const overallPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || categories.length === 0) return;

    const sel = select(svg);
    sel.selectAll('g.ring').remove();

    const center = size / 2;
    const maxOuterRadius = (size / 2) - 4;
    const sortedCats = [...categories].sort((a, b) => b.allocated - a.allocated);

    sortedCats.forEach((cat, i) => {
      const outerR = maxOuterRadius - i * (RING_WIDTH + RING_GAP);
      const innerR = outerR - RING_WIDTH;
      if (innerR < 10) return;

      const color = cat.categoryColor ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      const pct = cat.allocated > 0 ? cat.spent / cat.allocated : 0;
      const clampedPct = Math.min(pct, 1.3); // allow slight overshoot visually

      const arcGen = d3Arc<unknown>()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .cornerRadius(RING_WIDTH / 2)
        .startAngle(0);

      const g = sel.append('g').attr('class', 'ring')
        .attr('transform', `translate(${center},${center})`);

      // Background arc (full circle, muted)
      g.append('path')
        .attr('d', arcGen({ endAngle: Math.PI * 2 }) as string)
        .attr('fill', color)
        .attr('opacity', MUTED_OPACITY);

      // Foreground arc (spent portion)
      const foreground = g.append('path')
        .attr('fill', pct > 1 ? 'var(--color-danger)' : color);

      if (!hasAnimated.current) {
        foreground
          .attr('d', arcGen({ endAngle: 0 }) as string)
          .transition()
          .duration(ANIMATION_DURATION)
          .delay(i * 80)
          .attrTween('d', () => {
            const interp = interpolate(0, clampedPct * Math.PI * 2);
            return (t: number) => arcGen({ endAngle: interp(t) }) as string;
          });
      } else {
        foreground.attr('d', arcGen({ endAngle: clampedPct * Math.PI * 2 }) as string);
      }
    });

    hasAnimated.current = true;
  }, [categories, size]);

  if (categories.length === 0) {
    return (
      <div className={styles.container} style={{ width: size, height: size }}>
        <div className={styles.centerLabel}>
          <span className={styles.subLabel}>No budget data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg ref={svgRef} width={size} height={size} />
      <div className={styles.centerLabel}>
        <span className={styles.percentage}>{overallPct}%</span>
        <span className={styles.subLabel}>spent</span>
      </div>
    </div>
  );
}
