import { cachedModelMiddleware } from "@/services/ai/cached-model-middleware";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export const openaiCached = cachedModelMiddleware("openai", openai);

export const anthropicCached = cachedModelMiddleware("anthropic", anthropic);
