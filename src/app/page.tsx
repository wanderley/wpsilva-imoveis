"use client";

import { InterestingLots } from "@/features/auction/scrap/components/InterestingLots";
import { PendingReviewLots } from "@/features/auction/scrap/components/PendingReviewLots";

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <InterestingLots />
      <PendingReviewLots />
    </div>
  );
}
