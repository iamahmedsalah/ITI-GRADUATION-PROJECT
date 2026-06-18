import OpenAI from "openai";

const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";
const GEMINI_DEFAULT_FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];
const GEMINI_THINKING_LEVELS = new Set(["MINIMAL", "LOW", "MEDIUM", "HIGH"]);

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const parseCsvEnv = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  baseURL: (
    process.env.GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, ""),
  models: unique([
    process.env.GEMINI_MODEL || process.env.AI_GEMINI_MODEL || GEMINI_DEFAULT_MODEL,
    ...(
      process.env.GEMINI_FALLBACK_MODELS
        ? parseCsvEnv(process.env.GEMINI_FALLBACK_MODELS)
        : GEMINI_DEFAULT_FALLBACK_MODELS
    ),
  ]),
});

export const getOpenAiConfig = () => ({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.AI_OPENAI_API_KEY ||
    process.env.AI_API_KEY,
  baseURL: (
    process.env.OPENAI_BASE_URL ||
    process.env.AI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, ""),
  model: process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini",
});

const createOpenAiClient = ({ apiKey, baseURL }) =>
  new OpenAI({
    apiKey,
    baseURL,
  });

const getGeminiModelPath = (model) =>
  String(model || "")
    .replace(/^models\//, "")
    .trim();

const getGeminiThinkingLevel = () => {
  const thinkingLevel = String(process.env.GEMINI_THINKING_LEVEL || "")
    .trim()
    .toUpperCase();

  return GEMINI_THINKING_LEVELS.has(thinkingLevel) ? thinkingLevel : null;
};

const buildGeminiGenerationConfig = (
  maxTokens,
  responseMimeType = "application/json",
) => {
  const thinkingLevel = getGeminiThinkingLevel();
  const generationConfig = {
    maxOutputTokens: maxTokens,
    responseMimeType,
  };

  if (thinkingLevel) {
    generationConfig.thinkingConfig = {
      thinkingLevel,
    };
  }

  return generationConfig;
};

const isProviderAuthError = (error) => [401, 403].includes(error?.status);

export const extractJsonObject = (value = "") => {
  const raw = String(value || "").trim();
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not include a JSON object.");
  }

  return JSON.parse(candidate.slice(start, end + 1));
};

export const sanitizeAiProviderMessage = (message = "") =>
  String(message || "AI provider request failed.")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/AIza[A-Za-z0-9_-]+/g, "AIza***")
    .replace(/([?&]key=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(Incorrect API key provided:)\s*[^.\s]+/i, "$1 [redacted]")
    .trim();

const toAiProviderError = (
  providerError,
  fallbackMessage = "AI provider request failed.",
) => {
  const providerStatus =
    providerError?.status ||
    providerError?.response?.status ||
    providerError?.statusCode;
  const error = new Error(
    sanitizeAiProviderMessage(providerError?.message || fallbackMessage),
  );
  error.status =
    Number.isInteger(providerStatus) && providerStatus >= 400 && providerStatus < 600
      ? providerStatus
      : 502;
  return error;
};

const callOpenAiJson = async ({ system, user, maxTokens, config }) => {
  const client = createOpenAiClient(config);
  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider returned an empty response.");
    }

    return {
      json: extractJsonObject(content),
      model: config.model,
      provider: "openai",
    };
  } catch (providerError) {
    throw toAiProviderError(providerError);
  }
};

const callGeminiJson = async ({ system, user, maxTokens, config }) => {
  const modelPath = getGeminiModelPath(config.model);
  const url = new URL(
    `${config.baseURL}/models/${encodeURIComponent(modelPath)}:generateContent`,
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: user }],
          },
        ],
        generationConfig: buildGeminiGenerationConfig(maxTokens),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data?.error?.message || "Gemini provider request failed.",
      );
      error.status = response.status;
      throw error;
    }

    const content = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n");

    if (!content) {
      const blockReason =
        data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      throw new Error(
        blockReason
          ? `Gemini returned no JSON content: ${blockReason}`
          : "Gemini returned an empty response.",
      );
    }

    return {
      json: extractJsonObject(content),
      model: config.model,
      provider: "gemini",
    };
  } catch (providerError) {
    throw toAiProviderError(providerError, "Gemini provider request failed.");
  }
};

export const callAiJson = async ({ system, user, maxTokens = 2200 }) => {
  const geminiConfig = getGeminiConfig();
  const openAiConfig = getOpenAiConfig();
  const providers = [];

  if (geminiConfig.apiKey) {
    geminiConfig.models.forEach((model) => {
      providers.push({
        name: `gemini:${model}`,
        provider: "gemini",
        call: () =>
          callGeminiJson({
            system,
            user,
            maxTokens,
            config: { ...geminiConfig, model },
          }),
      });
    });
  }

  if (openAiConfig.apiKey) {
    providers.push({
      name: `openai:${openAiConfig.model}`,
      provider: "openai",
      call: () => callOpenAiJson({ system, user, maxTokens, config: openAiConfig }),
    });
  }

  if (!providers.length) {
    const error = new Error(
      "AI API key is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY.",
    );
    error.status = 503;
    throw error;
  }

  let lastError = null;
  const failedProviders = [];

  for (const provider of providers) {
    try {
      return await provider.call();
    } catch (error) {
      lastError = error;
      failedProviders.push({
        provider: provider.provider,
        name: provider.name,
        status: error.status || 502,
        message: sanitizeAiProviderMessage(error.message),
      });
      if (provider.name === providers[providers.length - 1]?.name) {
        break;
      }
      console.warn(
        `AI provider ${provider.name} failed; trying fallback provider.`,
        {
          status: error.status || 502,
          message: sanitizeAiProviderMessage(error.message),
        },
      );
    }
  }

  const openAiAuthFailure = failedProviders.find(
    (failure) => failure.provider === "openai" && isProviderAuthError(failure),
  );
  const geminiTemporaryFailure = failedProviders.find(
    (failure) =>
      failure.provider === "gemini" &&
      [429, 500, 502, 503, 504].includes(failure.status),
  );

  if (openAiAuthFailure && geminiTemporaryFailure) {
    const error = new Error(
      "Gemini is temporarily unavailable and the OpenAI fallback key is invalid. Fix OPENAI_API_KEY or wait and retry Gemini.",
    );
    error.status = geminiTemporaryFailure.status;
    throw error;
  }

  throw lastError ||
    Object.assign(new Error("AI provider request failed."), { status: 502 });
};

const callOpenAiText = async ({ system, messages, maxTokens, config }) => {
  const client = createOpenAiClient(config);

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.5,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        ...messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      ],
    });
    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("AI provider returned an empty response.");
    }

    return {
      content,
      model: config.model,
      provider: "openai",
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    };
  } catch (providerError) {
    throw toAiProviderError(providerError);
  }
};

const callGeminiText = async ({ system, messages, maxTokens, config }) => {
  const modelPath = getGeminiModelPath(config.model);
  const url = new URL(
    `${config.baseURL}/models/${encodeURIComponent(modelPath)}:generateContent`,
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: buildGeminiGenerationConfig(maxTokens, "text/plain"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data?.error?.message || "Gemini provider request failed.",
      );
      error.status = response.status;
      throw error;
    }

    const content = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!content) {
      const blockReason =
        data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      throw new Error(
        blockReason
          ? `Gemini returned no chat content: ${blockReason}`
          : "Gemini returned an empty response.",
      );
    }

    const promptTokens = data?.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data?.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens =
      data?.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

    return {
      content,
      model: config.model,
      provider: "gemini",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
    };
  } catch (providerError) {
    throw toAiProviderError(providerError, "Gemini provider request failed.");
  }
};

export const callAiText = async ({ system, messages, maxTokens = 900 }) => {
  const geminiConfig = getGeminiConfig();
  const openAiConfig = getOpenAiConfig();
  const providers = [];

  if (geminiConfig.apiKey) {
    geminiConfig.models.forEach((model) => {
      providers.push({
        name: `gemini:${model}`,
        provider: "gemini",
        call: () =>
          callGeminiText({
            system,
            messages,
            maxTokens,
            config: { ...geminiConfig, model },
          }),
      });
    });
  }

  if (openAiConfig.apiKey) {
    providers.push({
      name: `openai:${openAiConfig.model}`,
      provider: "openai",
      call: () => callOpenAiText({ system, messages, maxTokens, config: openAiConfig }),
    });
  }

  if (!providers.length) {
    const error = new Error(
      "AI API key is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY.",
    );
    error.status = 503;
    throw error;
  }

  let lastError = null;
  const failedProviders = [];

  for (const provider of providers) {
    try {
      return await provider.call();
    } catch (error) {
      lastError = error;
      failedProviders.push({
        provider: provider.provider,
        name: provider.name,
        status: error.status || 502,
        message: sanitizeAiProviderMessage(error.message),
      });
      if (provider.name === providers[providers.length - 1]?.name) {
        break;
      }
      console.warn(`AI provider ${provider.name} failed; trying fallback provider.`, {
        status: error.status || 502,
        message: sanitizeAiProviderMessage(error.message),
      });
    }
  }

  const openAiAuthFailure = failedProviders.find(
    (failure) => failure.provider === "openai" && isProviderAuthError(failure),
  );
  const geminiTemporaryFailure = failedProviders.find(
    (failure) =>
      failure.provider === "gemini" &&
      [429, 500, 502, 503, 504].includes(failure.status),
  );

  if (openAiAuthFailure && geminiTemporaryFailure) {
    const error = new Error(
      "Gemini is temporarily unavailable and the OpenAI fallback key is invalid. Fix OPENAI_API_KEY or wait and retry Gemini.",
    );
    error.status = geminiTemporaryFailure.status;
    throw error;
  }

  throw lastError ||
    Object.assign(new Error("AI provider request failed."), { status: 502 });
};
