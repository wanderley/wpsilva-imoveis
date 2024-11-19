"use client";

import { getAllScrapsByScrapperID } from "@/features/auction/scraper/api";
import { ScrapStatus } from "@/features/auction/scraper/repository";
import { queryKeys } from "@/hooks";
import { refreshScraps } from "@/services/scraper/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useScraps(scraperID: string, status?: ScrapStatus) {
  return useQuery({
    queryKey: queryKeys.scraps(scraperID, status),
    queryFn: async () => await getAllScrapsByScrapperID(scraperID, status),
  });
}

export function useRefreshScrapsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scraperID }: { scraperID: string }) =>
      await refreshScraps(scraperID),
    onSuccess: (_, { scraperID }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scraps(scraperID) });
    },
  });
}
