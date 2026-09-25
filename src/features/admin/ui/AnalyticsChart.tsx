"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DataPoint = {
  label: string;
  value: number;
  display?: string;
};

interface AnalyticsChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  accentClass?: string;
}

export function AnalyticsChart({
  title,
  description,
  data,
  accentClass = "bg-blue-500",
}: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card className="h-full ">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">
          {title}
        </CardTitle>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="mt-4 flex h-48 items-end gap-3 sm:gap-4 overflow-x-scroll">
          {data.map((point) => {
            const height = `${(point.value / maxValue) * 100}%`;
            return (
              <div
                key={point.label}
                className="flex-1 text-center text-xs text-slate-500"
              >
                <div className="mb-2 flex flex-col items-center gap-1">
                  <span className="font-semibold text-slate-800">
                    {point.display ?? point.value}
                  </span>
                  <div className="flex h-32 w-full items-end rounded-md bg-slate-100">
                    <div
                      className={cn(
                        "w-full rounded-md transition-all duration-300",
                        accentClass,
                      )}
                      style={{ height }}
                    />
                  </div>
                </div>
                <span className="inline-block w-full truncate text-[0.7rem]">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
