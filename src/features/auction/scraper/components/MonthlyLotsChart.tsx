"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getColors } from "@/features/auction/scrap/lib/chart-colors";
import {
  ReportMetadata,
  ReportMonthlyLots,
} from "@/features/auction/scraper/api";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function MonthlyLotsChart({
  scraperIDs,
  data,
}: {
  scraperIDs: ReportMetadata["scraperIDs"];
  data: ReportMonthlyLots[];
}) {
  const colors = getColors(scraperIDs.length);
  return (
    <ChartContainer config={{}}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis
            dataKey="month"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          {scraperIDs.map((scraperID, index) => (
            <Bar
              key={scraperID + index}
              stackId="a"
              dataKey={scraperID}
              fill={colors[index % colors.length]}
            />
          ))}
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
