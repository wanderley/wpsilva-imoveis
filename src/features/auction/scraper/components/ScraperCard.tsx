"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportStatusTotals } from "@/features/auction/scraper/api";
import StatusCard from "@/features/auction/scraper/components/StatusCard";
import { ExternalLink, Globe } from "lucide-react";
import Link from "next/link";

export default function ScraperCard({
  scraperID,
  statusTotals,
}: {
  scraperID: string;
  statusTotals: ReportStatusTotals;
}) {
  return (
    <Card className="w-full transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {scraperID}
          </div>
          <Link
            href={`https://${scraperID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            Site do Leilão
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Link href={`/scraper/${scraperID}`}>
              <StatusCard
                title="Total"
                value={statusTotals.totalLots}
                color=""
              />
            </Link>
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
      </CardContent>
    </Card>
  );
}
