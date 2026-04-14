import { createServerFn } from "@tanstack/react-start";
import type { CountPreset, DayPreset, RecentCommitMode } from "@/actions/commits.actions";

export type PostGenerationContext = {
  activeTab: "repo-wise" | "recent";
  recentMode: RecentCommitMode;
  countPreset: CountPreset;
  customCount: string;
  dayPreset: DayPreset;
  customStartDate: string;
  customEndDate: string;
};

type SelectedCommitForPost = {
  sha: string;
  message: string;
  authorName: string;
  date: string;
  url: string;
  repoFullName: string;
};

export type GeneratePostContentInput = {
  payload: {
    repoName: string | null;
    repoDescription: string | null;
    repoTags: string[];
    commits: SelectedCommitForPost[];
  };
  context: PostGenerationContext;
  selectedCount: number;
  totalVisibleCount: number;
};

export type GeneratedPosts = {
  xPost: string;
  linkedinPost: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type FeatureKind = "Added" | "Updated" | "Fixed" | "Refined";

const normalizeGeneratedText = (value: string) => {
  return value
    .replace(/\b\d+\s+commit(s)?\b/gi, "work updates")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const coerceXLength = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length <= 280) {
    return trimmed;
  }

  return `${trimmed.slice(0, 277).trimEnd()}...`;
};

const avoidGenericLinkedInOpeners = (value: string) => {
  const trimmed = value.trim();
  const blockedOpeners = [/^thrilled to announce/i, /^i\s*'?m excited to share/i, /^i am excited to share/i];

  if (blockedOpeners.some((pattern) => pattern.test(trimmed))) {
    return `Built and shipped this recently.\n\n${trimmed}`;
  }

  return trimmed;
};

const toProjectName = (repoName: string | null) => {
  if (!repoName) {
    return "this project";
  }

  const parts = repoName.split("/");
  return parts[parts.length - 1] || repoName;
};

const classifyFeatureKind = (message: string): FeatureKind => {
  const lower = message.toLowerCase();

  if (/fix|bug|issue|error|crash|loop|resolve/.test(lower)) {
    return "Fixed";
  }
  if (/add|added|create|created|implement|implemented|introduce|introduced/.test(lower)) {
    return "Added";
  }
  if (/update|updated|improve|improved|optimiz|enhance|upgrade/.test(lower)) {
    return "Updated";
  }

  return "Refined";
};

const toFeatureText = (message: string) => {
  return message
    .replace(/^[\s-]*/g, "")
    .replace(/\b(wip|tmp|temp)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[a-z]/, (char) => char.toUpperCase());
};

const extractFeatureItems = (messages: string[]) => {
  return messages
    .map((message) => message.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((message) => ({ kind: classifyFeatureKind(message), text: toFeatureText(message) }));
};

const parseGeminiJson = (raw: string): GeneratedPosts => {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid AI response format");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedPosts>;
  if (!parsed.xPost || !parsed.linkedinPost) {
    throw new Error("AI response is missing required fields");
  }

  return {
    xPost: coerceXLength(normalizeGeneratedText(parsed.xPost)),
    linkedinPost: avoidGenericLinkedInOpeners(normalizeGeneratedText(parsed.linkedinPost)),
  };
};

const GEMINI_MODEL_FALLBACK = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash"] as const;

const getContextPrefix = (input: GeneratePostContentInput, isWholeRepoSelection: boolean) => {
  if (isWholeRepoSelection) {
    return "I built this";
  }

  if (input.context.activeTab === "recent" && input.context.recentMode === "day") {
    if (input.context.dayPreset === "today") {
      return "Today I";
    }
    if (input.context.dayPreset === "yesterday") {
      return "Yesterday I";
    }
    if (input.context.dayPreset === "last2days") {
      return "Over the last 2 days, I";
    }
    if (input.context.dayPreset === "last3days") {
      return "Over the last 3 days, I";
    }
    if (input.context.dayPreset === "lastWeek") {
      return "Over the last week, I";
    }

    return "In this period, I";
  }

  return "I";
};

const buildLocalPosts = (input: GeneratePostContentInput, isWholeRepoSelection: boolean): GeneratedPosts => {
  const prefix = getContextPrefix(input, isWholeRepoSelection);
  const projectName = toProjectName(input.payload.repoName);
  const features = extractFeatureItems(input.payload.commits.map((commit) => commit.message));

  const topFeature = features[0]?.text ?? "made meaningful progress";
  const secondFeature = features[1]?.text;

  const xPost = coerceXLength(
    normalizeGeneratedText(
      `${prefix} on ${projectName}: ${topFeature}.${secondFeature ? ` Also ${secondFeature}.` : ""}`,
    ),
  );

  const linkedinLines: string[] = [
    normalizeGeneratedText(`${prefix} on ${projectName}, focusing on product-facing improvements and cleaner execution.`),
  ];

  if (input.payload.repoDescription) {
    linkedinLines.push(`Focus: ${normalizeGeneratedText(input.payload.repoDescription)}`);
  }

  if (features.length >= 3) {
    linkedinLines.push("What changed:");
    for (const feature of features) {
      linkedinLines.push(`- ${feature.kind}: ${feature.text}`);
    }
  } else if (features.length > 0) {
    const sentence = features.map((feature) => `${feature.kind.toLowerCase()} ${feature.text.toLowerCase()}`).join(", and ");
    linkedinLines.push(`This round of work ${sentence}.`);
  }

  if (input.payload.repoTags.length > 0) {
    linkedinLines.push(`Tech: ${input.payload.repoTags.slice(0, 6).join(", ")}`);
  }

  return {
    xPost,
    linkedinPost: avoidGenericLinkedInOpeners(linkedinLines.join("\n\n")),
  };
};

const generateWithFallback = async (apiKey: string, prompt: string) => {
  let lastError = "Unknown Gemini error";

  for (const model of GEMINI_MODEL_FALLBACK) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const json = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      lastError = json.error?.message ?? `Gemini request failed on model ${model}`;
      continue;
    }

    const raw = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
    if (!raw) {
      lastError = `Empty response from model ${model}`;
      continue;
    }

    return parseGeminiJson(raw);
  }

  throw new Error(`Failed to generate posts from Gemini: ${lastError}`);
};

export const generatePostsFromCommits = createServerFn({ method: "POST" })
  .inputValidator((input: GeneratePostContentInput) => input)
  .handler(async ({ data }) => {
    if (!data.payload.commits.length) {
      throw new Error("Select at least one commit to generate posts");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const isWholeRepoSelection =
      data.context.activeTab === "repo-wise" &&
      data.selectedCount > 0 &&
      data.selectedCount === data.totalVisibleCount &&
      data.payload.repoName &&
      data.payload.repoName !== "multiple";

    const scopeLabel = (() => {
      if (isWholeRepoSelection) {
        return "Whole Repo";
      }

      if (data.context.activeTab === "recent" && data.context.recentMode === "day") {
        if (data.context.dayPreset === "today") {
          return "Today";
        }
        if (data.context.dayPreset === "yesterday") {
          return "Yesterday";
        }
        if (data.context.dayPreset === "last2days") {
          return "Last 2 Days";
        }
        if (data.context.dayPreset === "last3days") {
          return "Last 3 Days";
        }
        if (data.context.dayPreset === "lastWeek") {
          return "Last 7 Days";
        }

        return "Specific Date Range";
      }

      return "Specific Update";
    })();

    const prompt = `Role: You are a developer's personal social media ghostwriter. Your job is to take raw GitHub commit data and transform it into organic, high-engagement posts for X (Twitter) and LinkedIn. Your writing style is "Developer-to-Developer": concise, technical, slightly informal, and completely free of AI cliches like "delighted to share," "game-changer," or "revolutionary."

Writing Style Guidelines:
- No AI-isms. Do not start with: "Thrilled to announce," "I'm excited to share," "I am excited to share," or "In today's fast-paced world."
- Human flow. Use active verbs and natural developer phrasing.
- Meaningful translation. Do not copy commit lines directly. Interpret them into clear, useful human sentences.
- Formatting. Use bullet points only when listing 3+ distinct updates. Otherwise, use short punchy paragraphs.
- Include the project name naturally in both posts.
- Keep output feature-wise: mention what was Added, Updated, Fixed, or Refined where relevant.
- Do not include commit counts, SHAs, or links in the post body.

Platform-Specific Rules:
- X: strictly under 280 characters, punchy build-in-public tone, focused on the biggest win.
- LinkedIn: readable length, professional but conversational, with a strong hook.

Conditional Logic for Opening:
- If scope is Whole Repo: start with "I built this..." or "Finally put this together..."
- If scope is Daily/Specific Date: start with "Today I..." or "Spent some time today on..."

Output format:
- Return ONLY valid JSON with exactly this shape: {"xPost":"...","linkedinPost":"..."}

User Message:
Scope: ${scopeLabel}
Data: ${JSON.stringify(
      {
        context: data.context,
        payload: data.payload,
      },
      null,
      2,
    )}

Task: Generate one X post and one LinkedIn post based on these commits. Include project name and describe feature-wise updates in natural language.
`;

    try {
      return await generateWithFallback(apiKey, prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const quotaOrRateLimited = /quota exceeded|rate limit|429/i.test(message);

      if (quotaOrRateLimited) {
        return buildLocalPosts(data, Boolean(isWholeRepoSelection));
      }

      throw error;
    }
  });