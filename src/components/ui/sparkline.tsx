"use client";

import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SparklineProps {
  data: number[];
  height?: number;
  className?: string;
}

/** Catmull-Rom → cubic bezier for a smooth Apple-Health-style line */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1: [number, number] = [
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
    ];
    const c2: [number, number] = [
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
    ];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Tiny animated line chart that draws itself in. Inherits its color
 * from `currentColor`; no chart library needed on the home screen.
 */
export function Sparkline({ data, height = 48, className }: SparklineProps) {
  const id = useId().replace(/[:]/g, "");
  const reduceMotion = useReducedMotion();
  const width = 100; // viewBox units; scales to container

  const { line, area } = useMemo(() => {
    if (data.length < 2) return { line: "", area: "" };
    const max = Math.max(...data, 1);
    const pad = height * 0.12;
    const points: [number, number][] = data.map((v, i) => [
      (i / (data.length - 1)) * width,
      height - pad - (v / max) * (height - pad * 2),
    ]);
    const line = smoothPath(points);
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { line, area };
  }, [data, height]);

  if (!line) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#spark-${id})`}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
