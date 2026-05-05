const OPENAI_PROJECT_NAME_MODEL = "gpt-5-nano";

const PROJECT_NAME_INSTRUCTIONS = [
  "Generate a short, user-friendly project name from the user's build request.",
  "Output only the project name.",
  "Use 2 to 5 words in Title Case.",
  "Do not use quotes, markdown, emoji, trailing punctuation, or subtitles.",
  "Keep it under 40 characters.",
].join(" ");

type OpenAIOutputItem = {
  content?: unknown;
  text?: unknown;
};

type OpenAIResponseBody = {
  output_text?: unknown;
  output?: unknown;
  status?: unknown;
  incomplete_details?: {
    reason?: unknown;
  };
  error?: {
    message?: unknown;
  };
};

const collectTextValues = (value: unknown): string[] => {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTextValues);
  }

  const record = value as Record<string, unknown>;
  const values: string[] = [];

  if (typeof record.text === "string") {
    values.push(record.text);
  }

  if (record.content) {
    values.push(...collectTextValues(record.content));
  }

  return values;
};

const extractResponseText = (data: OpenAIResponseBody) => {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  return data.output
    .flatMap((item: OpenAIOutputItem) => (
      item.content ? collectTextValues(item.content) : collectTextValues(item)
    ))
    .join(" ");
};

const normalizeProjectName = (value: string) => (
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/^\s*\d+[\).:-]\s*/, "")
    .replace(/^\s*(project\s+name|title)\s*:\s*/i, "")
    .replace(/^[`"']+|[`"']+$/g, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim()
);

const getOpenAIErrorMessage = (data: OpenAIResponseBody) => (
  typeof data.error?.message === "string" ? data.error.message : null
);

const getOpenAIIncompleteMessage = (data: OpenAIResponseBody) => {
  if (data.status !== "incomplete") {
    return null;
  }

  const reason = typeof data.incomplete_details?.reason === "string"
    ? data.incomplete_details.reason
    : "unknown";

  return `OpenAI returned an incomplete project name response (${reason}).`;
};

export const generateProjectName = async (prompt: string) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate project names.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_PROJECT_NAME_MODEL,
      instructions: PROJECT_NAME_INSTRUCTIONS,
      input: `Build request:\n${prompt}`,
      reasoning: {
        effort: "minimal",
      },
      text: {
        verbosity: "low",
      },
      max_output_tokens: 96,
    }),
  });

  const data = await response.json() as OpenAIResponseBody;

  if (!response.ok) {
    throw new Error(
      getOpenAIErrorMessage(data) ?? "OpenAI failed to generate a project name.",
    );
  }

  const projectName = normalizeProjectName(extractResponseText(data));

  if (!projectName) {
    throw new Error(
      getOpenAIIncompleteMessage(data) ?? "OpenAI returned an empty project name.",
    );
  }

  return projectName;
};
