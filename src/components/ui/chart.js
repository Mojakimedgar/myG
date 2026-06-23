import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
const THEMES = { light: "", dark: ".dark" };
const ChartContext = React.createContext(null);
function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }
    return context;
}
const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
    return (_jsx(ChartContext.Provider, { value: { config }, children: _jsxs("div", { "data-chart": chartId, ref: ref, className: cn("flex aspect-video justify-center text-xs", className), ...props, children: [_jsx(ChartStyle, { id: chartId, config: config }), _jsx(RechartsPrimitive.ResponsiveContainer, { children: children })] }) }));
});
ChartContainer.displayName = "Chart";
const ChartStyle = ({ id, config, }) => {
    const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.theme || cfg.color);
    if (!colorConfig.length)
        return null;
    return (_jsx("style", { dangerouslySetInnerHTML: {
            __html: Object.entries(THEMES)
                .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                .map(([key, itemConfig]) => {
                const color = itemConfig.theme?.[theme] ||
                    itemConfig.color;
                return color ? `  --color-${key}: ${color};` : null;
            })
                .filter(Boolean)
                .join("\n")}
}
`)
                .join("\n"),
        } }));
};
const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartTooltipContent = React.forwardRef(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey, }, ref) => {
    const { config } = useChart();
    const safePayload = Array.isArray(payload) ? payload : [];
    const tooltipLabel = React.useMemo(() => {
        if (hideLabel || safePayload.length === 0)
            return null;
        const [item] = safePayload;
        const key = `${labelKey || item.dataKey || item.name || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const value = typeof label === "string"
            ? config[label]?.label || label
            : itemConfig?.label;
        if (labelFormatter) {
            return (_jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, safePayload) }));
        }
        if (!value)
            return null;
        return (_jsx("div", { className: cn("font-medium", labelClassName), children: value }));
    }, [
        safePayload,
        hideLabel,
        label,
        labelFormatter,
        labelClassName,
        config,
        labelKey,
    ]);
    if (!active || safePayload.length === 0)
        return null;
    const nestLabel = safePayload.length === 1 && indicator !== "dot";
    return (_jsxs("div", { ref: ref, className: cn("grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl", className), children: [!nestLabel ? tooltipLabel : null, _jsx("div", { className: "grid gap-1.5", children: safePayload.map((item, index) => {
                    const key = `${nameKey || item.name || item.dataKey || "value"}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);
                    const indicatorColor = color || item.color || item.payload?.fill;
                    return (_jsx("div", { className: "flex gap-2", children: formatter && item.value !== undefined && item.name ? (formatter(item.value, item.name, item, index, safePayload)) : (_jsxs(_Fragment, { children: [!hideIndicator && (_jsx("div", { className: "h-2.5 w-2.5 rounded-[2px]", style: { backgroundColor: indicatorColor } })), _jsxs("div", { className: "flex flex-1 justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: itemConfig?.label || item.name }), _jsx("span", { className: "font-mono", children: typeof item.value === "number"
                                                ? item.value.toLocaleString()
                                                : item.value })] })] })) }, `${item.dataKey}-${index}`));
                }) })] }));
});
ChartTooltipContent.displayName = "ChartTooltip";
const ChartLegend = RechartsPrimitive.Legend;
const ChartLegendContent = React.forwardRef(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, }, ref) => {
    const { config } = useChart();
    const safePayload = Array.isArray(payload) ? payload : [];
    if (safePayload.length === 0)
        return null;
    return (_jsx("div", { ref: ref, className: cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className), children: safePayload.map((item, index) => {
            const key = `${nameKey || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            return (_jsxs("div", { className: "flex items-center gap-1.5", children: [!hideIcon && itemConfig?.icon ? (_jsx(itemConfig.icon, {})) : (_jsx("div", { className: "h-2 w-2 rounded-[2px]", style: { backgroundColor: item.color } })), itemConfig?.label] }, `${item.value}-${index}`));
        }) }));
});
ChartLegendContent.displayName = "ChartLegend";
function getPayloadConfigFromPayload(config, payload, key) {
    if (!payload || typeof payload !== "object")
        return undefined;
    const nested = payload.payload && typeof payload.payload === "object"
        ? payload.payload
        : undefined;
    let resolvedKey = key;
    if (key in payload && typeof payload[key] === "string") {
        resolvedKey = payload[key];
    }
    else if (nested &&
        key in nested &&
        typeof nested[key] === "string") {
        resolvedKey = nested[key];
    }
    return config[resolvedKey] || config[key];
}
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, };
