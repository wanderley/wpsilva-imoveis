"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ReportMetadata,
  ReportMonthlyLots,
  ReportStatusTotals,
} from "@/features/auction/scraper/api";

import MonthlyLotsChart from "./MonthlyLotsChart";
import StatusCard from "./StatusCard";

export default function ReportOverview({
  statusTotals,
  monthlyLots,
  scraperIDs,
}: {
  statusTotals: ReportStatusTotals;
  monthlyLots: ReportMonthlyLots[];
  scraperIDs: ReportMetadata["scraperIDs"];
}) {
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>Visualização Geral</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-8">
          <div className="w-full lg:w-2/5">
            <MonthlyLotsChart scraperIDs={scraperIDs} data={monthlyLots} />
          </div>
          <div className="w-full lg:w-3/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
              <StatusCard
                title="Total"
                value={statusTotals.totalLots}
                color=""
              />
              <StatusCard
                title="Sucesso"
                value={statusTotals.successLots}
                color="text-green-600"
              />
              <StatusCard
                title="Falhou"
                value={statusTotals.failedLots}
                color="text-red-600"
              />
              <StatusCard
                title="Incompleto"
                value={statusTotals.incompleteLots}
                color="text-orange-500"
              />
              <StatusCard
                title="Sem Análise"
                value={statusTotals.lotsWithoutAnalysis}
                color="text-yellow-500"
              />
              <StatusCard
                title="Não Baixado"
                value={statusTotals.notFetchedLots}
                color="text-blue-600"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
