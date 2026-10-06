"use client";

import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useId } from "react";
import { AXIS_TICK, ChartFrame, ChartTooltip, GRID_STROKE, tickDate, tickWeekday } from "./chart-primitives";
import { formatNumber } from "@/lib/units";

const useAnimate = () => !useReducedMotion();

/* ---------------------------------- Weight ---------------------------------- */

export function WeightChart({
  data,
  unit,
  height = 240,
  goalDirection,
}: {
  data: { date: string; value: number }[];
  unit: string;
  height?: number;
  goalDirection?: "up" | "down" | "flat";
}) {
  const animate = useAnimate();
  const gid = useId().replace(/:/g, "");
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.5, (max - min) * 0.25);
  return (
    <ChartFrame height={height} label={`Body weight trend in ${unit}${goalDirection ? `, goal direction ${goalDirection}` : ""}`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={`w-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis
            domain={[Math.floor((min - pad) * 2) / 2, Math.ceil((max + pad) * 2) / 2]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={<ChartTooltip labelFormat={tickDate} rows={(p) => [{ label: "Weight", value: `${Number(p[0].value).toFixed(1)} ${unit}`, color: "var(--brand)" }]} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--brand)"
            strokeWidth={2}
            fill={`url(#w-${gid})`}
            dot={data.length <= 14 ? { r: 3, fill: "var(--surface)", stroke: "var(--brand)", strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: "var(--brand)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={animate}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* --------------------------------- Calories --------------------------------- */

export function CaloriesChart({
  data,
  target,
  height = 220,
}: {
  data: { date: string; calories: number; logged: boolean }[];
  target: number;
  height?: number;
}) {
  const animate = useAnimate();
  const short = data.length <= 7;
  return (
    <ChartFrame height={height} label={`Daily calories versus ${target} kcal target`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap={short ? "28%" : "18%"}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="date" tickFormatter={short ? tickWeekday : tickDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={
              <ChartTooltip
                labelFormat={tickDate}
                rows={(p) => {
                  const row = p[0].payload as { calories: number; logged: boolean };
                  return row.logged
                    ? [
                        { label: "Eaten", value: `${formatNumber(row.calories)} kcal`, color: "var(--chart-1)" },
                        { label: "Target", value: `${formatNumber(target)} kcal` },
                      ]
                    : [{ label: "Not logged", value: "—" }];
                }}
              />
            }
          />
          <ReferenceLine y={target} stroke="var(--foreground)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <Bar dataKey="calories" radius={[4, 4, 0, 0]} isAnimationActive={animate} animationDuration={700}>
            {data.map((d) => (
              <Cell
                key={d.date}
                fill={!d.logged ? "var(--muted)" : d.calories > target * 1.1 ? "var(--warning)" : "var(--chart-1)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* --------------------------------- Protein --------------------------------- */

export function MacroTrendChart<T extends { date: string; logged: boolean }>({
  data,
  dataKey,
  target,
  color,
  label,
  height = 200,
}: {
  data: T[];
  dataKey: keyof T & string;
  target: number;
  color: string;
  label: string;
  height?: number;
}) {
  const animate = useAnimate();
  const gid = useId().replace(/:/g, "");
  return (
    <ChartFrame height={height} label={`${label} per day versus ${target}g target`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`m-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                labelFormat={tickDate}
                rows={(p) => {
                  const row = p[0].payload as { logged: boolean } & Record<string, number>;
                  return row.logged
                    ? [
                        { label, value: `${Math.round(row[dataKey])}g`, color },
                        { label: "Target", value: `${target}g` },
                      ]
                    : [{ label: "Not logged", value: "—" }];
                }}
              />
            }
          />
          <ReferenceLine y={target} stroke="var(--foreground)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey={dataKey as string}
            stroke={color}
            strokeWidth={2}
            fill={`url(#m-${gid})`}
            isAnimationActive={animate}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ---------------------------------- Volume ---------------------------------- */

export function VolumeChart({
  data,
  xKey,
  height = 220,
  xFormat = tickDate,
  unit = "kg",
}: {
  data: { volume: number; [k: string]: number | string }[];
  xKey: string;
  height?: number;
  xFormat?: (v: string) => string;
  unit?: string;
}) {
  const animate = useAnimate();
  return (
    <ChartFrame height={height} label="Training volume over time">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey={xKey} tickFormatter={xFormat} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={12} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={
              <ChartTooltip
                labelFormat={xFormat}
                rows={(p) => [{ label: "Volume", value: `${formatNumber(Number(p[0].value))} ${unit}`, color: "var(--chart-1)" }]}
              />
            }
          />
          <Bar dataKey="volume" fill="var(--chart-1)" radius={[4, 4, 0, 0]} isAnimationActive={animate} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ---------------------------- Exercise progression ---------------------------- */

export function ExerciseProgressChart({
  data,
  dataKey,
  label,
  unit,
  height = 260,
}: {
  data: { date: string; [k: string]: number | string }[];
  dataKey: string;
  label: string;
  unit: string;
  height?: number;
}) {
  const animate = useAnimate();
  return (
    <ChartFrame height={height} label={`${label} progression`}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} domain={["dataMin - 5", "dataMax + 5"]} tickFormatter={(v: number) => formatNumber(v)} />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={<ChartTooltip labelFormat={tickDate} rows={(p) => [{ label, value: `${formatNumber(Number(p[0].value), 1)} ${unit}`, color: "var(--brand)" }]} />}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="var(--brand)"
            strokeWidth={2}
            dot={{ r: 3.5, fill: "var(--surface)", stroke: "var(--brand)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--brand)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={animate}
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ------------------------------- Muscle radar ------------------------------- */

export function MuscleRadar({ data, height = 260 }: { data: { label: string; sets: number }[]; height?: number }) {
  const animate = useAnimate();
  return (
    <ChartFrame height={height} label="Sets per muscle group">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={GRID_STROKE} />
          <PolarAngleAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 12 }} />
          <Tooltip content={<ChartTooltip rows={(p) => [{ label: "Sets", value: String(p[0].value), color: "var(--brand)" }]} />} />
          <Radar dataKey="sets" stroke="var(--brand)" strokeWidth={2} fill="var(--brand)" fillOpacity={0.18} isAnimationActive={animate} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
