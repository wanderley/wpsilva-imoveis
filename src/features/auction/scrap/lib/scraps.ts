import type { ScrapProfit } from "@/db/schema";

export function selectOptionBasedOnProfitBand<T>(
  profit: ScrapProfit,
  options:
    | {
        loss?: T;
        low_profit?: T;
        moderate_profit?: T;
        high_profit?: T;
        else: T;
      }
    | {
        loss: T;
        low_profit: T;
        moderate_profit: T;
        high_profit: T;
      },
): T {
  if ("else" in options) {
    if (profit.lucro_percentual < 0) {
      return options.loss || options.else;
    }
    if (profit.lucro_percentual < 20) {
      return options.low_profit || options.else;
    }
    if (profit.lucro_percentual < 30) {
      return options.moderate_profit || options.else;
    }
    return options.high_profit || options.else;
  }
  if (profit.lucro_percentual < 0) {
    return options.loss;
  }
  if (profit.lucro_percentual < 20) {
    return options.low_profit;
  }
  if (profit.lucro_percentual < 30) {
    return options.moderate_profit;
  }
  return options.high_profit;
}
