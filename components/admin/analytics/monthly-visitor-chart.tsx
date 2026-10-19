"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  TrendingUp,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  ShieldCheck,
  MousePointerClick,
} from "lucide-react";
import {
  getMonthlyAnalytics,
  getAdjacentMonth,
  getAvailableMonths,
  recordPreviewVisit,
  MonthlyAnalyticsSummary,
} from "@/lib/services/analytics-service";

interface MonthlyVisitorChartProps {
  initialYear?: number;
  initialMonth?: number; // 1..12
}

export function MonthlyVisitorChart({
  initialYear = 2026,
  initialMonth = 10,
}: MonthlyVisitorChartProps) {
  // Safe client state initialized without SSR/hydration mismatch
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number }>(() => ({
    year: initialYear,
    month: initialMonth,
  }));

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // On mount: record 1 preview hit for today
  useEffect(() => {
    recordPreviewVisit(window.location.pathname);
  }, []);

  // Compute monthly analytics dynamically based on selectedPeriod
  const summary: MonthlyAnalyticsSummary = useMemo(() => {
    return getMonthlyAnalytics(selectedPeriod.year, selectedPeriod.month);
  }, [selectedPeriod]);

  // Available months for the selector dropdown
  const availableMonths = useMemo(() => {
    return getAvailableMonths(2026, 10, 12);
  }, []);

  // Navigation handlers
  const handlePrevMonth = () => {
    setSelectedPeriod((prev) => getAdjacentMonth(prev.year, prev.month, -1));
    setHoveredIndex(null);
  };

  const handleNextMonth = () => {
    setSelectedPeriod((prev) => getAdjacentMonth(prev.year, prev.month, 1));
    setHoveredIndex(null);
  };

  const handleSelectMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, m] = e.target.value.split("-").map(Number);
    setSelectedPeriod({ year: y, month: m });
    setHoveredIndex(null);
  };

  // SVG Chart Dimensions
  const svgWidth = 840;
  const svgHeight = 240;
  const padding = { top: 20, right: 24, bottom: 36, left: 54 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate scales
  const days = summary.dailyMetrics;
  const maxVisitorsRaw = useMemo(() => {
    return Math.max(...days.map((d) => d.visitors), 100);
  }, [days]);

  // Round up max to a clean multiple of 100 or 250
  const yMax = useMemo(() => {
    const step = maxVisitorsRaw > 1000 ? 250 : 100;
    return Math.ceil(maxVisitorsRaw / step) * step;
  }, [maxVisitorsRaw]);

  // Coordinates mapping
  const points = useMemo(() => {
    if (days.length === 0) return [];
    return days.map((item, index) => {
      const x = padding.left + (index / (days.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (item.visitors / yMax) * chartHeight;
      return { x, y, item, index };
    });
  }, [days, chartWidth, chartHeight, padding.left, padding.top, yMax]);

  // Generate SVG path for line and area fill
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };

    // Build smooth cubic bezier or line segments
    let lPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Catmull-Rom to Cubic Bezier control points for organic flow
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      lPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const baselineY = padding.top + chartHeight;
    const aPath = `${lPath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [points, chartHeight, padding.top]);

  // Y-axis tick intervals (4 intervals)
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      const val = Math.round((yMax / count) * i);
      const y = padding.top + chartHeight - (val / yMax) * chartHeight;
      ticks.push({ val, y });
    }
    return ticks;
  }, [yMax, chartHeight, padding.top]);

  // X-axis label steps (e.g. days 1, 5, 10, 15, 20, 25, end)
  const xLabels = useMemo(() => {
    if (days.length === 0) return [];
    return points.filter((p) => {
      const day = p.item.day;
      return day === 1 || day % 5 === 0 || day === days.length;
    });
  }, [days.length, points]);

  // Mouse hover calculation
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const scaleX = svgWidth / rect.width;
      const chartX = mouseX * scaleX;

      // Find closest point
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - chartX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      setHoveredIndex(closestIdx);
    },
    [points, svgWidth]
  );

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      {/* 1. Header with Title, Period Navigator & Simulated Analytics Pill */}
      <div className="p-5 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Monthly Visitor Velocity</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {summary.monthLabel}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily visitor traffic, unique patron sessions, and page impressions across Kanhaiya Collection
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Simulated Badge + Month Navigator */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Explicit Simulated Demo Data Label */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold"
            title="Generated deterministically for offline development preview. Production third-party analytics are not connected."
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Simulated Analytics (Dev Preview)</span>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <select
              value={`${selectedPeriod.year}-${selectedPeriod.month}`}
              onChange={handleSelectMonth}
              className="bg-transparent text-xs font-bold text-foreground px-2 py-1 focus:outline-none cursor-pointer"
              aria-label="Select Analytics Month"
            >
              {availableMonths.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {m.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              type="button"
              className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Metric Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20 border-b border-border/60 text-xs">
        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Total Visitors
            </span>
            <span className="text-lg font-black text-foreground font-mono mt-0.5 block">
              {summary.totalVisitors.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-muted-foreground">in {summary.monthLabel}</span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Daily Average
            </span>
            <span className="text-lg font-black text-foreground font-mono mt-0.5 block">
              {summary.avgDailyVisitors.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-muted-foreground">visitors / day</span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Calendar className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Peak Traffic Day
            </span>
            <span className="text-lg font-black text-foreground font-mono mt-0.5 block">
              {summary.peakDay.formattedDate}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono">
              {summary.peakDay.visitors.toLocaleString("en-IN")} visitors
            </span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Total Pageviews
            </span>
            <span className="text-lg font-black text-foreground font-mono mt-0.5 block">
              {summary.totalPageViews.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-muted-foreground">~3.8 views / patron</span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Eye className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 3. Responsive SVG Line & Area Chart Container */}
      <div className="p-4 sm:p-6 relative select-none">
        <div className="w-full relative aspect-[21/8] min-h-[220px] max-h-[300px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* Premium Gold/Amber Area Gradient */}
              <linearGradient id="visitorAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8891A" stopOpacity="0.32" />
                <stop offset="65%" stopColor="#C8891A" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#C8891A" stopOpacity="0.0" />
              </linearGradient>

              {/* Stroke glow filter */}
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C8891A" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={svgWidth - padding.right}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-mono select-none"
                >
                  {tick.val}
                </text>
              </g>
            ))}

            {/* Filled Area Gradient */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#visitorAreaGradient)"
                className="transition-all duration-300"
              />
            )}

            {/* Line Stroke Path */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#C8891A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#goldGlow)"
                className="transition-all duration-300"
              />
            )}

            {/* X-Axis Tick Marks and Day Labels */}
            {xLabels.map((p, idx) => (
              <g key={idx}>
                <line
                  x1={p.x}
                  y1={padding.top + chartHeight}
                  x2={p.x}
                  y2={padding.top + chartHeight + 6}
                  stroke="currentColor"
                  strokeOpacity="0.2"
                />
                <text
                  x={p.x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-semibold select-none"
                >
                  {p.item.formattedDate}
                </text>
              </g>
            ))}

            {/* Interactive Vertical Guideline & Indicator on Hover */}
            {activePoint && (
              <g className="pointer-events-none">
                {/* Vertical Guideline */}
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={padding.top + chartHeight}
                  stroke="#C8891A"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  strokeOpacity="0.8"
                />

                {/* Outer pulsing ring */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="7"
                  fill="#C8891A"
                  fillOpacity="0.2"
                />

                {/* Inner solid dot */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="4"
                  fill="#C8891A"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Floating Tooltip Card */}
          {activePoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-75"
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${(activePoint.y / svgHeight) * 100}%`,
                transform: `translate(${
                  activePoint.x > svgWidth * 0.7 ? "-105%" : "12px"
                }, -50%)`,
              }}
            >
              <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[170px]">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1">
                  <span className="font-bold text-foreground">
                    {activePoint.item.dayOfWeek}, {activePoint.item.formattedDate}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-bold">
                    Day {activePoint.item.day}
                  </span>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Daily Visitors:</span>
                    <strong className="text-foreground font-mono text-xs">
                      {activePoint.item.visitors.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Unique Patrons:</span>
                    <strong className="text-foreground font-mono text-xs">
                      {activePoint.item.uniqueVisitors.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Page Impressions:</span>
                    <strong className="text-foreground font-mono text-xs">
                      {activePoint.item.pageViews.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  {activePoint.item.localPreviewVisits > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-semibold pt-1 border-t border-border/40 text-[10px]">
                      <span>Local Preview Hits:</span>
                      <span className="font-mono">+{activePoint.item.localPreviewVisits}</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-[9px] text-muted-foreground/75 border-t border-border/40 flex items-center justify-between">
                  <span>Simulated Deterministic</span>
                  <span className="text-amber-600 font-bold">Offline Preview</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Footer Notice */}
        <div className="mt-4 pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MousePointerClick className="h-3.5 w-3.5 text-primary" />
            <span>Hover across the chart line to inspect specific daily visitor metrics and estimated page impressions.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            <span>Golden Area indicates visitor density</span>
          </div>
        </div>
      </div>
    </div>
  );
}
