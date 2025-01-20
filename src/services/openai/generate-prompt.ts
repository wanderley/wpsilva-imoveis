import { Model } from "@/services/openai/types";
import { execSync } from "child_process";
import fs from "fs";
import OpenAI from "openai";
import { ChatCompletionContentPart } from "openai/resources/chat/completions.mjs";

type Input = {
  name: string;
  append: ChatCompletionContentPart[];
};

export async function generatePrompt({
  assistantModel,
  executionModel,
  inputs,
  initialPrompt,
}: {
  assistantModel: Model;
  executionModel: Model;
  inputs: Input[];
  initialPrompt?: string;
}) {
  const prompts = [];
  let prompt = initialPrompt ?? readInput("> Enter the inital prompt");
  prompts.push(prompt);
  let outputs = await generateAnswers(executionModel, prompt, inputs);
  while (true) {
    const feedback = readFeedback(inputs, outputs, prompt);
    if (feedback === null) {
      break;
    }

    const assistantPrompt = `# Instructions
You are an agent that is responsible for improving the quality of a prompt that is provided to a LLM agent. 
Your task is to refine the prompt given to the LLM agent to enhance the accuracy and relevance of the output as expected by the user.

## Criteria
- Analyze the existing instructions and the results of the eval.  Understand which behaviors lead to failures mentioned in the feedback.
- If a comment is provided, understand the user's feedback and improve the prompt.
- If a suggestion for a new prompt is provided, understand the user's feedback and improve the prompt.
- Improve the part of the prompt that is related to the user's feedback, leaving the rest of the prompt unchanged.
- Try changing the format if this formatting doesn't work well - consider basic XML (e.g. <step> <substep> <if> <case>) or markdown as alternatives.

# Data
<current_prompt>${prompt}</current_prompt>
${convertOutputsToXml(inputs, outputs)}
${feedback.comments ? `<comments>${feedback.comments}</comments>\n` : ""}${feedback.newPrompt ? `<user_suggested_prompt>${feedback.newPrompt}</user_suggested_prompt>\n` : ""}

# Conclusion
Based on the feedback, suggest an improved prompt. Return the improved prompt in the following format: <improved_prompt>[new prompt]</improved_prompt>`;
    console.info(`\x1b[90m> Assistant prompt:\n${assistantPrompt}\x1b[0m`);
    const assistantResponse = await generateAnswer(
      assistantModel,
      assistantPrompt,
    );
    const newPrompt = assistantResponse
      .match(/<improved_prompt>(.*?)<\/improved_prompt>/s)?.[1]
      ?.trim();
    console.info(`\x1b[33m> New prompt:\n${newPrompt}\x1b[0m`);
    if (newPrompt == null) {
      console.error(
        "\x1b[31mNo new prompt found in the assistant response.\x1b[0m",
      );
      break;
    }
    prompts.push(newPrompt);
    prompt = newPrompt;
    outputs = await generateAnswers(executionModel, prompt, inputs);
  }
  return prompts;
}

async function generateAnswers(
  model: Model,
  prompt: string,
  inputs: Input[],
): Promise<string[]> {
  return await Promise.all(
    inputs.map((input) => {
      const res = generateAnswer(model, prompt, input);
      console.info(`[generate-prompt] Generated answer for ${input.name}`);
      return res;
    }),
  );
}

async function generateAnswer(model: Model, prompt: string, input?: Input) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [...(input?.append || []), { type: "text", text: prompt }],
      },
    ],
    response_format: { type: "text" },
  });
  return response.choices[0].message.content!;
}

function readInput(message: string, content?: string) {
  console.log(message);
  const filePath = "/tmp/prompt-read-input.xml";
  if (!content) {
    execSync(`cat /dev/null > ${filePath}`);
  } else {
    fs.writeFileSync(filePath, content);
  }
  execSync(
    `/Applications/Cursor.app/Contents/MacOS/Cursor ${filePath} --wait 2> /dev/null`,
  );
  return fs.readFileSync(filePath, "utf-8");
}

function readFeedback(inputs: Input[], outputs: string[], prompt: string) {
  let content = "";
  content += convertOutputsToXml(inputs, outputs);
  content += "\n\n";
  content += "<prompt>\n";
  content += prompt.trim();
  content += "\n";
  content += "</prompt>\n";
  content += "\n\n";
  content += "<comments>\n\n</comments>\n";
  content += "\n\n";
  content += `<new_prompt>\n${prompt.trim()}\n</new_prompt>\n`;
  const feedback = readInput("> Enter the feedback", content);
  // console.log(feedback);
  const comments = feedback.match(/<comments>(.*?)<\/comments>/s)?.[1].trim();
  let newPrompt = feedback
    .match(/<new_prompt>(.*?)<\/new_prompt>/s)?.[1]
    .trim();

  if (newPrompt?.trim() == prompt.trim()) {
    newPrompt = undefined;
  }
  if ((comments == null || comments == "") && newPrompt == null) {
    return null;
  }
  return { comments, newPrompt };
}

function convertOutputsToXml(inputs: Input[], outputs: string[]) {
  let content = "<outputs>\n";
  for (let i = 0; i < inputs.length; i++) {
    content += `  <output name="${inputs[i].name}">\n`;
    content += outputs[i];
    content += "\n";
    content += "  </output>\n";
  }
  content += "</outputs>\n";
  return content;
}
