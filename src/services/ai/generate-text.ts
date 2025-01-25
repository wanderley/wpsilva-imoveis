import { Model } from "@/services/ai/types";
import { IFile } from "@/services/file/types";
import OpenAI from "openai";
import { ChatCompletionContentPartImage } from "openai/resources/chat/completions.mjs";

export async function generateText(
  model: Model,
  images: IFile[],
  prompt: string,
  options?: {
    store?: boolean;
    metadata?: Record<string, string>;
  },
): Promise<string | null> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const base64Images = await Promise.all(
    images.map(generateChatCompletionContentPartImageFromFile),
  );
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [...base64Images, { type: "text", text: prompt }],
      },
    ],
    response_format: { type: "text" },
    store: options?.store,
    metadata: options?.metadata,
  });
  return response.choices[0].message.content;
}

export async function generateChatCompletionContentPartImageFromFile(
  file: IFile,
): Promise<ChatCompletionContentPartImage> {
  const data = await file.read();
  const buffer = Buffer.from(data);
  let type;
  switch (file.extension()) {
    case ".jpg":
      type = "jpeg";
      break;
    case ".png":
      type = "png";
      break;
    case ".webp":
      type = "webp";
      break;
    default:
      throw new Error("Unsupported file type: " + file.extension());
  }
  return {
    type: "image_url",
    image_url: {
      url: `data:image/${type};base64,${buffer.toString("base64")}`,
    },
  };
}
