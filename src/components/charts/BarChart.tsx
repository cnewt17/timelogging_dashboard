import {
  BarChart as RechartsBarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getColor, CHART_DEFAULTS } from "@/utils/chartConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarConfig {
  dataKey: string;
  name?: string;
  color?: string;
}

type TooltipFormatter = (
  value: number,
  name: string,
  item: { payload: Record<string, unknown> },
  index: number,
  payload: ReadonlyArray<{ payload: Record<string, unknown> }>,
) => [React.ReactNode, string] | React.ReactNode;

export interface BarClickData {
  payload: Record<string, unknown>;
  index: number;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  bars: BarConfig[];
  xAxisKey: string;
  layout?: "horizontal" | "vertical";
  height?: number;
  stacked?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
  ariaLabel?: string;
  tooltipFormatter?: TooltipFormatter;
  onBarClick?: (data: BarClickData) => void;
  activeIndex?: number | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BarChart({
  data,
  bars,
  xAxisKey,
  layout = "horizontal",
  height = CHART_DEFAULTS.height,
  stacked = false,
  showTooltip = true,
  showGrid = true,
  showLegend = false,
  className = "",
  ariaLabel = "Bar chart",
  tooltipFormatter,
  onBarClick,
  activeIndex,
}: BarChartProps) {
  if (data.length === 0) return null;

  const chartHeight = Math.max(height, CHART_DEFAULTS.minHeight);

  // In Recharts, layout="vertical" renders horizontal bars.
  // When vertical layout, the category axis is Y and value axis is X.
  const isHorizontalBars = layout === "vertical";

  return (
    <div role="img" aria-label={ariaLabel} className={className}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 20, bottom: 5, left: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray={CHART_DEFAULTS.gridStyle.strokeDasharray}
              stroke={CHART_DEFAULTS.gridStyle.stroke}
              horizontal={!isHorizontalBars}
              vertical={isHorizontalBars}
            />
          )}

          {isHorizontalBars ? (
            <>
              <XAxis type="number" {...CHART_DEFAULTS.axisStyle} />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                width={140}
                {...CHART_DEFAULTS.axisStyle}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} {...CHART_DEFAULTS.axisStyle} />
              <YAxis {...CHART_DEFAULTS.axisStyle} />
            </>
          )}

          {showTooltip && (
            <Tooltip
              {...CHART_DEFAULTS.tooltipStyle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={tooltipFormatter as any}
            />
          )}

          {showLegend && <Legend />}

          {bars.map((bar, barIndex) => {
            const barFill = bar.color ?? getColor(barIndex);
            return (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name ?? bar.dataKey}
                fill={barFill}
                radius={CHART_DEFAULTS.barRadius}
                stackId={stacked ? "stack" : undefined}
                onClick={
                  onBarClick
                    ? (barData, index) =>
                        onBarClick({
                          payload: barData.payload as Record<string, unknown>,
                          index,
                        })
                    : undefined
                }
                cursor={onBarClick ? "pointer" : undefined}
                shape={
                  activeIndex != null
                    ? (
                        props: React.ComponentProps<typeof Rectangle> & {
                          index?: number;
                        },
                      ) => {
                        const { index, ...rest } = props;
                        const opacity = index === activeIndex ? 1 : 0.5;
                        return <Rectangle {...rest} fillOpacity={opacity} />;
                      }
                    : undefined
                }
              />
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
