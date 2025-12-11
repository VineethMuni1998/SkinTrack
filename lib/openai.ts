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

CRITICAL RULES FOR SYNERGIES vs RECOMMENDATIONS:

**Product Synergies** - ONLY for products ALREADY being used correctly together:
- Products that are CURRENTLY in the routine and working well together
- Products properly layered at the right time of day
- Products with complementary benefits being used correctly
- This section is ONLY for praising what's ALREADY WORKING WELL
- DO NOT suggest any changes or improvements here
- Example: "CeraVe Cleanser + Vitamin C Serum work well together in your morning routine"

**Recommendations** - ONLY suggest changes or NEW additions:
1. TIMING CHANGES: Products being used at WRONG time of day (e.g., retinol in morning should move to night, Vitamin C at night should move to morning)
2. FREQUENCY CHANGES: Products that would benefit from different usage frequency (e.g., use twice daily instead of once, or reduce from daily to every other day)
3. NEW PRODUCTS: Maximum of 2 NEW products NOT currently in the routine that would benefit the user
4. NEVER recommend products that are ALREADY in the routine being used correctly
5. NEVER suggest layering products that are ALREADY in the same time block - they're already layered correctly!
6. NEVER repeat what's already in synergies section

**Conflict Rules:**
- Only flag conflicts when products are used in the same time of day and on overlapping days
- If timeOfDay differs, DO NOT flag as conflict; products are already separated correctly
- If skipDays are provided, treat those days as "not used" when evaluating conflicts

**General Rules:**
- Use the provided product ids in all outputs to avoid mismatches
- Personalize based on age and skinType
- Be specific and actionable in recommendations

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
        "recommendation": "What to do about it"
      }
    ],
    "synergies": [
      {
        "productIds": ["<id1>", "<id2>"],
        "benefit": "What benefit they provide together (currently working well)",
        "description": "How they work together or should be layered (current good practice)"
      }
    ]
  },
  "recommendations": [
    "ONLY suggest: (1) timing changes for existing products, (2) frequency changes, or (3) max 2 NEW products to add. DO NOT repeat what's already working."
  ],
  "overallTimeline": "Overall timeline summary for when to expect results from this routine"
}

Timeline guidelines:
- Retinoids: 4-12 weeks
- Vitamin C: 2-4 weeks
- Exfoliants (AHA/BHA): 1-2 weeks
- Moisturizers: immediate effects
- Sunscreen: preventive, daily use

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

    const baseRecommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter(
          (item): item is string => typeof item === "string"
        )
      : [];

    return {
      timeline,
      interactions: {
        conflicts,
        synergies,
      },
      recommendations: baseRecommendations,
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

export interface ProductRecommendation {
  name: string;
  brand: string;
  category: string;
  reason: string;
  expectedTimeframe: string;
}

interface SkinAnalysisInput {
  skinType: string;
  concerns: {
    acne?: number;
    wrinkles?: number;
    oiliness?: number;
    dryness?: number;
    redness?: number;
    spots?: number;
    darkCircles?: number;
    texture?: number;
    moisture?: number;
  };
}

export async function recommendProducts(
  skinAnalysis: SkinAnalysisInput
): Promise<ProductRecommendation[]> {
  const openai = getOpenAI();

  // Get top 3 concerns (sorted by severity)
  const topConcerns = Object.entries(skinAnalysis.concerns)
    .filter(([_, value]) => value && value > 10)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([concern, value]) => ({ concern, severity: value }));

  const concernsText = topConcerns.length > 0
    ? topConcerns.map(c => `${c.concern} (severity: ${c.severity}%)`).join(', ')
    : 'general maintenance';

  const prompt = `You are a skincare expert recommending products based on skin analysis.

Skin Analysis:
- Skin Type: ${skinAnalysis.skinType}
- Main Concerns: ${concernsText}

Recommend 5-10 skincare products that would be beneficial for this skin profile. Focus on addressing the main concerns while being appropriate for the skin type.

For each product, provide:
- A specific product name (use real, well-known products when possible)
- Brand name
- Category (cleanser, toner, serum, moisturizer, sunscreen, treatment, etc.)
- Why it's recommended (how it addresses the skin concerns)
- Expected timeframe for results

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "name": "Product name",
      "brand": "Brand name",
      "category": "Product category",
      "reason": "Why this product is recommended",
      "expectedTimeframe": "Expected time to see results (e.g., '2-4 weeks')"
    }
  ]
}

Guidelines:
- Recommend products from various categories (cleanser, treatment, moisturizer, sunscreen, etc.)
- For acne concerns, consider salicylic acid, benzoyl peroxide, niacinamide
- For wrinkles/aging, consider retinol, peptides, vitamin C
- For dryness, consider hyaluronic acid, ceramides, rich moisturizers
- For oiliness, consider lightweight, oil-free products
- Always include a sunscreen (crucial for all skin types)
- Be realistic about timeframes (most actives take 4-12 weeks)
- Prioritize well-known, accessible brands

Return ONLY valid JSON, no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: ANALYSIS_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable skincare consultant who recommends products based on skin analysis. You only respond with valid JSON.",
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

    const parsed = JSON.parse(content) as {
      recommendations?: Array<{
        name?: string;
        brand?: string;
        category?: string;
        reason?: string;
        expectedTimeframe?: string;
      }>;
    };

    if (!Array.isArray(parsed.recommendations)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate and normalize recommendations
    const recommendations: ProductRecommendation[] = parsed.recommendations
      .filter((rec) => rec.name && rec.brand && rec.category)
      .map((rec) => ({
        name: rec.name || "",
        brand: rec.brand || "",
        category: rec.category || "",
        reason: rec.reason || "",
        expectedTimeframe: rec.expectedTimeframe || "4-6 weeks",
      }));

    return recommendations;
  } catch (error) {
    console.error("OpenAI product recommendation error:", error);
    throw error;
  }
}
