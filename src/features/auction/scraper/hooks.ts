"use client";

import { queryKeys } from "@/hooks";
import { refreshScraps } from "@/services/scraper/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAllScrapsByScrapperID } from "./api";

export function useScraps(scraperID: string) {
  return useQuery({
    queryKey: queryKeys.scraps(scraperID),
    queryFn: async () => await getAllScrapsByScrapperID(scraperID),
  });
}

export function useRefreshScrapsMutation(scraperID: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scraperID }: { scraperID: string }) =>
      await refreshScraps(scraperID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scraps(scraperID) });
    },
  });
}
