import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getPendingReviewLots,
  getScrapDetails,
  getScraps,
  refreshScraps,
  requestAnalysis,
  saveScrap,
  updateScrap,
} from "./actions";
import { ScrapWithFiles } from "./db/schema";

const queryKeys = {
  scraps: (scrapID: string) => ["scraps", scrapID],
  pendingReviewLots: ["pending-review-lots"],
  scrapDetails: (id: number) => ["scrapDetails", id],
};

export function useScraps(scrapID: string) {
  return useQuery({
    queryKey: queryKeys.scraps(scrapID),
    queryFn: async () => await getScraps(scrapID),
  });
}

export function usePendingReviewLots() {
  return useQuery({
    queryKey: queryKeys.pendingReviewLots,
    queryFn: async () => await getPendingReviewLots(),
    initialData: [],
  });
}

export function useRefreshScrapsMutation(scrapID: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scrapID }: { scrapID: string }) =>
      await refreshScraps(scrapID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scraps(scrapID) });
    },
  });
}

export function useUpdateScraperMutation(
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
    }) => await updateScrap(scrapID, url),
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
    mutationFn: async (scrap: ScrapWithFiles) => await saveScrap(scrap),
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
    mutationFn: async () => await requestAnalysis(scrapID),
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