import { Scrap, ScrapProfit } from "@/db/schema";
import {
  SearchLotsFilters,
  getPendingReviewLots,
  getScrapDetails,
  saveScrap,
  saveScrapProfit,
  searchLots,
} from "@/models/scraps/actions";
import { fetchScrapFromSource } from "@/services/scraper/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { updateAnalysis } from "./services/analyser/actions";

export const queryKeys = {
  scraps: (scraperID: string) => ["scraps", scraperID],
  pendingReviewLots: ["pending-review-lots"],
  scrapDetails: (id: number) => ["scrapDetails", String(id)],
};

export function useSearchLots(filters: SearchLotsFilters) {
  return useQuery<Scrap[]>({
    queryKey: ["lots", filters],
    queryFn: async () => await searchLots(filters),
  });
}

export function usePendingReviewLots() {
  return useQuery({
    queryKey: queryKeys.pendingReviewLots,
    queryFn: async () => await getPendingReviewLots(),
    initialData: [],
  });
}

export function useFetchScrapFromSourceMutation(
  scrapID: string,
  callbacks?: {
    onSuccess?: (id: number) => unknown;
    onError?: (id: number) => unknown;
  },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scrapID,
      url,
    }: {
      scrapID: string;
      url: string;
      id: number;
    }) => await fetchScrapFromSource(scrapID, url),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scraps(scrapID) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(id),
      });
      callbacks?.onSuccess?.(id);
    },
    onError: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scraps(scrapID) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.scrapDetails(id),
      });
      callbacks?.onError?.(id);
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
