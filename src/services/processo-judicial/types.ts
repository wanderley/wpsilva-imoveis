import { Model } from "../openai/types";

export type TextoExtraido =
  | { state: "pending" }
  | { state: "skipped" }
  | { state: "batching"; batchId: string }
  | {
      state: "success";
      type: Model | "mupdf";
      paginas: {
        pagina: number;
        texto: string;
      }[];
    }
  | { state: "error"; reason: string };
