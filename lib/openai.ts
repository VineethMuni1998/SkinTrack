import OpenAI from "openai";

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey });
};

const ANALYSIS_MODEL = process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini";
const INGREDIENT_MODEL = process.env.OPENAI_INGREDIENT_MODEL || "gpt-4o-mini";

export interface ProductInfo {
  id: string;
  name: string;
  brand?: string;
  ingredients?: string;
  category?: string;
  timeOfDay?: string;
  skipDays?: string[];
}

export interface UserContext {
  age?: number;
  skinType?: string;
}

export interface AnalysisResult {
  timeline: Array<{
    productId: string;
    productName: string;
    expectedResultsTime: string; // e.g., "2-4 weeks"
    description: string;
  }>;
  interactions: {
    conflicts: Array<{
      productIds: string[]; // must be the product IDs from input
      reason: string;
      recommendation: string;
    }>;
    synergies: Array<{
      productIds: string[]; // must be the product IDs from input
      benefit: string;
      description: string;
    }>;
  };
  recommendations: string[];
  overallTimeline: string;
}

export async function analyzeProducts(
  products: ProductInfo[],
  userContext?: UserContext
): Promise<AnalysisResult> {
  const openai = getOpenAI();
  const productsList = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand || "Unknown",
    ingredients: p.ingredients || "Not specified",
    category: p.category || "Unknown",
    timeOfDay: p.timeOfDay || "BOTH",
    skipDays: p.skipDays && p.skipDays.length > 0 ? p.skipDays : [],
  }));

  const userMeta = {
    age: userContext?.age ?? "unknown",
    skinType: userContext?.skinType ?? "unknown",
  };

  const prompt = `You are a skincare expert analyzing a skincare routine. Analyze the following products and provide detailed insights. Each product includes an id, timeOfDay (MORNING | NIGHT | BOTH), and optional skipDays (days of week to skip).

Products:
${JSON.stringify(productsList, null, 2)}

User context:
${JSON.stringify(userMeta, null, 2)}

Rules:
- Only flag conflicts when products are used in the same time of day and on overlapping days. If timeOfDay differs, DO NOT flag as a conflict; instead, adjust recommendation to keep them separated (e.g., Vitamin C AM vs Tretinoin PM).
- If skipDays are provided, treat those days as "not used" when evaluating conflicts.
- Prefer pairing synergies that share an active time (MORNING, NIGHT, BOTH). Do not merge unrelated products.
- Only surface synergies when the products can be used in the same time block (same timeOfDay or one is BOTH). If they do not overlap, add a recommendation about when to co-layer instead of listing under synergies.
- Use the provided product ids in all outputs to avoid mismatches.
- Personalize recommendations based on age and skinType. Be gentler for sensitive/younger skin and flag stronger actives or over-exfoliation for delicate skin types. Tailor routine guidance to the skin type.

Return JSON with this exact shape:
{
  "timeline": [
    {
      "productId": "<id from input>",
      "productName": "Product name",
      "expectedResultsTime": "e.g., '2-4 weeks' or '4-6 weeks'",
      "description": "What results to expect and when"
    }
  ],
  "interactions": {
    "conflicts": [
      {
        "productIds": ["<id1>", "<id2>"],
        "reason": "Why they conflict",
        "recommendation": "What to do about it (include timing guidance if applicable)"
      }
    ],
    "synergies": [
      {
        "productIds": ["<id1>", "<id2>"],
        "benefit": "What benefit they provide together",
        "description": "How they work together or should be layered"
      }
    ]
  },
  "recommendations": [
    "General recommendation 1",
    "General recommendation 2"
  ],
  "overallTimeline": "Overall timeline summary for when to expect results from this routine"
}

Be specific about timelines based on the product types and ingredients. Consider:
- Retinoids typically take 4-12 weeks
- Vitamin C can show results in 2-4 weeks
- Exfoliants (AHA/BHA) can show results in 1-2 weeks
- Moisturizers and hydrating products show immediate effects
- Sunscreen is preventive and should be used daily

Return ONLY valid JSON, no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: ANALYSIS_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a skincare expert with deep knowledge of ingredients, product interactions, and expected timelines for results. Provide accurate, helpful analysis in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as Partial<AnalysisResult> & {
      interactions?: unknown;
      timeline?: unknown;
      recommendations?: unknown;
      overallTimeline?: unknown;
    };

    // Validate and normalize product IDs in responses
    const knownIds = new Set(products.map((p) => p.id));
    const productById = new Map(products.map((p) => [p.id, p]));
    const resolveProductId = (maybeId: string, fallbackName?: string) => {
      if (knownIds.has(maybeId)) return maybeId;
      if (fallbackName) {
        const found = products.find((p) => p.name === fallbackName);
        if (found) return found.id;
      }
      return "";
    };

    const safeTimeline = Array.isArray(parsed.timeline)
      ? (parsed.timeline as Array<Record<string, unknown>>)
      : [];
    const timeline = safeTimeline
      .map((item) => {
        const productId = resolveProductId(
          typeof item.productId === "string" ? item.productId : "",
          typeof item.productName === "string" ? item.productName : undefined
        );
      return {
        productId,
        productName:
          typeof item.productName === "string" ? item.productName : "",
        expectedResultsTime:
          typeof item.expectedResultsTime === "string"
            ? item.expectedResultsTime
            : "",
        description: typeof item.description === "string" ? item.description : "",
      };
    })
      .filter((item) => !!item.productId);

    const interactions =
      (parsed.interactions as {
        conflicts?: Array<Record<string, unknown>>;
        synergies?: Array<Record<string, unknown>>;
      }) || { conflicts: [], synergies: [] };

    const normalizeIdsArray = (arr: unknown) =>
      Array.isArray(arr)
        ? arr
            .map((id) => (typeof id === "string" ? id : ""))
            .map((id) => resolveProductId(id))
            .filter(Boolean)
        : [];

    const shareTimeBlock = (ids: string[]) => {
      if (ids.length < 2) return false;
      const times = ids
        .map((id) => productById.get(id)?.timeOfDay || "BOTH")
        .map((t) => t.toUpperCase());
      const uniqueTimes = new Set(times.filter(Boolean));
      if (uniqueTimes.has("BOTH")) return true;
      return uniqueTimes.size === 1; // all morning or all night
    };

    const conflicts = (interactions.conflicts || [])
      .map((conflict) => ({
        productIds: normalizeIdsArray(conflict.productIds),
        reason: typeof conflict.reason === "string" ? conflict.reason : "",
        recommendation:
          typeof conflict.recommendation === "string"
            ? conflict.recommendation
            : "",
      }))
      .filter((entry) => entry.productIds.length >= 2);

    const synergies = (interactions.synergies || [])
      .map((synergy) => ({
        productIds: normalizeIdsArray(synergy.productIds),
        benefit: typeof synergy.benefit === "string" ? synergy.benefit : "",
        description:
          typeof synergy.description === "string" ? synergy.description : "",
      }))
      .filter((entry) => entry.productIds.length >= 2);

    const alignedSynergies = synergies.filter((entry) =>
      shareTimeBlock(entry.productIds)
    );
    const crossTimeSynergies = synergies.filter(
      (entry) => !shareTimeBlock(entry.productIds)
    );

    const extraRecommendations =
      crossTimeSynergies.length > 0
        ? crossTimeSynergies.map((entry) => {
            const names = entry.productIds
              .map((id) => productById.get(id)?.name || id)
              .join(" + ");
            return `Consider using ${names} in the same time block (e.g., both AM or both PM) if you want to layer them for synergy: ${entry.description}`;
          })
        : [];

    const baseRecommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter(
          (item): item is string => typeof item === "string"
        )
      : [];

    return {
      timeline,
      interactions: {
        conflicts,
        synergies: alignedSynergies,
      },
      recommendations: [...baseRecommendations, ...extraRecommendations],
      overallTimeline:
        typeof parsed.overallTimeline === "string" ? parsed.overallTimeline : "",
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw error;
  }
}

interface IngredientPromptInput {
  name: string;
  brand?: string;
  category?: string;
  description?: string;
}

export async function fetchProductIngredients({
  name,
  brand,
  category,
  description,
}: IngredientPromptInput): Promise<string> {
  const openai = getOpenAI();

  const prompt = `You are a cosmetic chemist that researches skincare formulations using public information.
Given the product details below, list the primary active skincare ingredients that are most likely present. Focus on well-known actives (e.g., retinol, niacinamide, peptides, hyaluronic acid).
If you are unsure, respond with "Unknown".

Product Name: ${name}
Brand: ${brand ?? "Unknown"}
Category: ${category ?? "Unknown"}
Description from user: ${description ?? "Not provided"}

Return the ingredients as a single comma-separated list with no additional commentary. Keep it under 10 ingredients.`;

  const completion = await openai.chat.completions.create({
    model: INGREDIENT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a concise skincare ingredient expert who only responds with comma-separated ingredient lists.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No ingredient response from OpenAI");
  }
  return content.replace(/^Ingredients:\s*/i, "");
}
