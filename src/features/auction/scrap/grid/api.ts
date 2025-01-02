export type LotsFilters = {
  min: string;
  max: string;
  phase: "interesting" | "pendingReview" | "";
  active: "0" | "1" | "";
  auctionStatus: "available" | "unavailable" | "all";
  profitMin: "10" | "20" | "30" | "40" | "";
};
