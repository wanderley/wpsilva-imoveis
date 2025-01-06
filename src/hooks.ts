import { Scrap, ScrapProfit } from "@/db/schema";
import { updateScrapFromSource } from "@/features/auction/scrap/api";
import {
  getScrapDetails,
  saveScrap,
  saveScrapProfit,
} from "@/models/scraps/actions";
import { updateAnalysis } from "@/services/analyser/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const queryKeys = {
  scrapers: ["scrapers"],
  scraps: (scraperID: string, status?: string) => ["scraps", scraperID, status],
  pendingReviewLots: ["pending-review-lots"],
  scrapDetails: (id: number) => ["scrapDetails", String(id)],
};

export function useFetchScrapFromSourceMutation(callbacks?: {
  onSuccess?: (id: number) => unknown;
  onError?: (id: number) => unknown;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scrap }: { scrap: Scrap }) =>
      await updateScrapFromSource(scrap.id),
    onSuccess: (_, { scrap }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scraps(scrap.scraper_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(scrap.id),
      });
      callbacks?.onSuccess?.(scrap.id);
    },
    onError: (_, { scrap }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scraps(scrap.scraper_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(scrap.id),
      });
      callbacks?.onError?.(scrap.id);
    },
  });
}

export function useScrapDetails(id: number) {
  return useQuery({
    queryKey: queryKeys.scrapDetails(id),
    queryFn: async () => await getScrapDetails(id),
  });
}

export function useUpdateScrapMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scrap: Scrap) => await saveScrap(scrap),
    onSuccess: (_, scrap) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(scrap.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.scraps(scrap.scraper_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingReviewLots,
      });
    },
  });
}

export function useRequestAnalysisMutation(
  scrapID: number,
  callbacks?: {
    onSuccess?: () => unknown;
    onMutate?: () => unknown;
  },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await updateAnalysis(scrapID, "gpt-4o"),
    onMutate: () => {
      callbacks?.onMutate?.();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(scrapID),
      });
      callbacks?.onSuccess?.();
    },
  });
}

export function useUpdateScrapProfitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profit: ScrapProfit) => await saveScrapProfit(profit),
    onSuccess: (_, profit) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(profit.scrap_id),
      });
    },
  });
}

export function usePagination(
  { itemsPerPage = 9 }: { itemsPerPage?: number } = { itemsPerPage: 9 },
) {
  const [currentPage, setCurrentPage] = useState(1);

  return { currentPage, setCurrentPage, itemsPerPage };
}
