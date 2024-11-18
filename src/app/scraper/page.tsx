"use client";

import { getReport } from "@/features/auction/scraper/api";
import ReportOverview from "@/features/auction/scraper/components/ReportOverview";
import ScraperCard from "@/features/auction/scraper/components/ScraperCard";
import { queryKeys } from "@/hooks";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const { isLoading, data } = useQuery({
    queryKey: queryKeys.scrapers,
    queryFn: async () => await getReport(),
  });

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-8">Carregando...</div>;
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <ReportOverview
        statusTotals={data.summary.accumulated}
        monthlyLots={data.timeseries}
        scraperIDs={data.metadata.scraperIDs}
      />

      <h2 className="text-2xl font-semibold mb-4">Scrapers</h2>
      <div className="space-y-6">
        {data.metadata.scraperIDs.map((scraperID, index) => (
          <ScraperCard
            key={index}
            scraperID={scraperID}
            statusTotals={data.summary.byScraperID[scraperID]}
          />
        ))}
      </div>
    </div>
  );
}
