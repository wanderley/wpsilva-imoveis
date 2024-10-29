"use client";

import { InterestingLots } from "@/components/InterestingLots";
import { PendingReviewLots } from "@/components/PendingReviewLots";
import React from "react";

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <InterestingLots />
      <PendingReviewLots />
    </div>
  );
}
