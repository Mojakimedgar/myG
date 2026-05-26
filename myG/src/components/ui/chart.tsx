import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});

ChartContainer.displayName = "Chart";

const ChartStyle = ({
  id,
  config,
}: {
  id: string;
  config: ChartConfig;
}) => {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.theme || cfg.color
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof THEMES] ||
      itemConfig.color;

    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  dataKey?: string;
  color?: string;
  payload?: any;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
    labelFormatter?: (value: any, payload: TooltipPayloadItem[]) => React.ReactNode;
    formatter?: (
      value: any,
      name: any,
      item: TooltipPayloadItem,
      index: number,
      payload: TooltipPayloadItem[]
    ) => React.ReactNode;
    indicator?: "dot" | "line" | "dashed";
    hideLabel?: boolean;
    hideIndicator?: boolean;
    labelClassName?: string;
    className?: string;
    color?: string;
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const safePayload = Array.isArray(payload) ? payload : [];

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || safePayload.length === 0) return null;

      const [item] = safePayload;

      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);

      const value =
        typeof label === "string"
          ? config[label]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, safePayload)}
          </div>
        );
      }

      if (!value) return null;

      return (
        <div className={cn("font-medium", labelClassName)}>{value}</div>
      );
    }, [
      safePayload,
      hideLabel,
      label,
      labelFormatter,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || safePayload.length === 0) return null;

    const nestLabel = safePayload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}

        <div className="grid gap-1.5">
          {safePayload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.color || item.payload?.fill;

            return (
              <div key={`${item.dataKey}-${index}`} className="flex gap-2">
                {formatter && item.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, safePayload)
                ) : (
                  <>
                    {!hideIndicator && (
                      <div
                        className="h-2.5 w-2.5 rounded-[2px]"
                        style={{ backgroundColor: indicatorColor }}
                      />
                    )}

                    <div className="flex flex-1 justify-between">
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>

                      <span className="font-mono">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : item.value}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[];
    verticalAlign?: "top" | "bottom";
    hideIcon?: boolean;
    nameKey?: string;
  }
>(
  (
    {
      className,
      hideIcon = false,
      payload,
      verticalAlign = "bottom",
      nameKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const safePayload = Array.isArray(payload) ? payload : [];

    if (safePayload.length === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {safePayload.map((item, index) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={`${item.value}-${index}`}
              className="flex items-center gap-1.5"
            >
              {!hideIcon && itemConfig?.icon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  }
);

ChartLegendContent.displayName = "ChartLegend";

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any,
  key: string
) {
  if (!payload || typeof payload !== "object") return undefined;

  const nested =
    payload.payload && typeof payload.payload === "object"
      ? payload.payload
      : undefined;

  let resolvedKey = key;

  if (key in payload && typeof payload[key] === "string") {
    resolvedKey = payload[key];
  } else if (
    nested &&
    key in nested &&
    typeof nested[key] === "string"
  ) {
    resolvedKey = nested[key];
  }

  return config[resolvedKey] || config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};