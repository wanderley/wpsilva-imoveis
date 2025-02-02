import { md5 } from "@/lib/md5";
import { LocalFile } from "@/services/file/local-file";
import {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
  simulateReadableStream,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from "ai";

interface Provider<T, S, R extends LanguageModelV1> {
  (modelId: T, settings?: S): R;
}

export function cachedModelMiddleware<T, S, R extends LanguageModelV1>(
  folder: string,
  model: Provider<T, S, R>,
): (modelId: T, settings?: S) => LanguageModelV1 {
  return (modelId: T, settings?: S) =>
    wrapLanguageModel({
      model: model(modelId, settings),
      middleware: {
        wrapGenerate: async ({ doGenerate, params }) => {
          const cached = await getCache<T>(folder, modelId, "generate", params);
          if (cached) {
            return cached;
          }
          const result = await doGenerate();
          await setCache<T>(folder, modelId, "generate", params, result);
          return result;
        },

        wrapStream: async ({ doStream, params }) => {
          const cached = await getCache<T>(folder, modelId, "stream", params);
          if (cached !== null) {
            return {
              stream: simulateReadableStream({
                initialDelayInMs: 0,
                chunkDelayInMs: 10,
                chunks: cached,
              }),
              rawCall: { rawPrompt: null, rawSettings: {} },
            };
          }

          // If not cached, proceed with streaming
          const { stream, ...rest } = await doStream();
          const fullResponse: LanguageModelV1StreamPart[] = [];
          const transformStream = new TransformStream<
            LanguageModelV1StreamPart,
            LanguageModelV1StreamPart
          >({
            transform(chunk, controller) {
              fullResponse.push(chunk);
              controller.enqueue(chunk);
            },
            flush() {
              setCache(folder, modelId, "stream", params, fullResponse);
            },
          });

          return {
            stream: stream.pipeThrough(transformStream),
            ...rest,
          };
        },
      },
    });
}

async function getCache<TModel>(
  folder: string,
  model: TModel,
  method: "generate",
  params: LanguageModelV1CallOptions,
): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>> | null>;
async function getCache<TModel>(
  folder: string,
  model: TModel,
  method: "stream",
  params: LanguageModelV1CallOptions,
): Promise<LanguageModelV1StreamPart[] | null>;
async function getCache<TModel>(
  folder: string,
  model: TModel,
  method: "generate" | "stream",
  params: LanguageModelV1CallOptions,
) {
  const path = getCacheFilePath(folder, model, method, params);
  const cacheFile = new LocalFile(path);
  if (!(await cacheFile.exists())) {
    return null;
  }
  const cached = JSON.parse((await cacheFile.read()).toString());
  switch (method) {
    case "generate":
      return {
        ...cached.value,
        response: {
          ...cached.value.response,
          timestamp: cached.value.response?.timestamp
            ? new Date(cached.value.response?.timestamp)
            : undefined,
        },
      };
    case "stream":
      return (cached.value as LanguageModelV1StreamPart[]).map((p) => {
        if (p.type === "response-metadata" && p.timestamp) {
          return { ...p, timestamp: new Date(p.timestamp) };
        } else return p;
      });
  }
}

async function setCache<TModel>(
  folder: string,
  model: TModel,
  method: "generate",
  params: LanguageModelV1CallOptions,
  value: Awaited<ReturnType<LanguageModelV1["doGenerate"]>>,
): Promise<void>;
async function setCache<TModel>(
  folder: string,
  model: TModel,
  method: "stream",
  params: LanguageModelV1CallOptions,
  value: LanguageModelV1StreamPart[],
): Promise<void>;
async function setCache<TModel>(
  folder: string,
  model: TModel,
  method: "generate" | "stream",
  params: LanguageModelV1CallOptions,
  value:
    | Awaited<ReturnType<LanguageModelV1["doGenerate"]>>
    | LanguageModelV1StreamPart[],
) {
  const path = getCacheFilePath(folder, model, method, params);
  const cacheFile = new LocalFile(path);
  await cacheFile.write(JSON.stringify({ params, value }, null, 2));
}

function getCacheFilePath<TModel>(
  folder: string,
  model: TModel,
  method: "generate" | "stream",
  params: LanguageModelV1CallOptions,
) {
  const paramsSerialized = JSON.stringify(params, null, 2);
  const cacheKey = md5(paramsSerialized);
  return `cache/ai/${folder}/${model}/${method}/${cacheKey}.json`;
}
