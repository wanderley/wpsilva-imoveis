import { cachedModelMiddleware } from "@/services/ai/cached-model-middleware";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export const openaiCached = cachedModelMiddleware("openai", openai);

export const anthropicCached = cachedModelMiddleware("anthropic", anthropic);

export const googleCached = cachedModelMiddleware("google", google);
