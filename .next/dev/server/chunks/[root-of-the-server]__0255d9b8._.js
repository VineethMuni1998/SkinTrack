module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/openai.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeProducts",
    ()=>analyzeProducts,
    "fetchProductIngredients",
    ()=>fetchProductIngredients
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/client.mjs [app-route] (ecmascript) <export OpenAI as default>");
;
const openai = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__["default"]({
    apiKey: process.env.OPENAI_API_KEY
});
const ANALYSIS_MODEL = process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini";
const INGREDIENT_MODEL = process.env.OPENAI_INGREDIENT_MODEL || "gpt-4o-mini";
async function analyzeProducts(products) {
    const productsList = products.map((p)=>({
            name: p.name,
            brand: p.brand || "Unknown",
            ingredients: p.ingredients || "Not specified",
            category: p.category || "Unknown"
        }));
    const prompt = `You are a skincare expert analyzing a skincare routine. Analyze the following products and provide detailed insights:

Products:
${JSON.stringify(productsList, null, 2)}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "timeline": [
    {
      "productName": "Product name",
      "expectedResultsTime": "e.g., '2-4 weeks' or '4-6 weeks'",
      "description": "What results to expect and when"
    }
  ],
  "interactions": {
    "conflicts": [
      {
        "productNames": ["Product 1", "Product 2"],
        "reason": "Why they conflict",
        "recommendation": "What to do about it"
      }
    ],
    "synergies": [
      {
        "productNames": ["Product 1", "Product 2"],
        "benefit": "What benefit they provide together",
        "description": "How they work together"
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

Identify any ingredient conflicts (e.g., retinol + vitamin C, certain acids together).
Identify synergies (e.g., niacinamide + retinol, hyaluronic acid + ceramides).

Return ONLY valid JSON, no additional text.`;
    try {
        const completion = await openai.chat.completions.create({
            model: ANALYSIS_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a skincare expert with deep knowledge of ingredients, product interactions, and expected timelines for results. Provide accurate, helpful analysis in JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: {
                type: "json_object"
            }
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }
        const parsed = JSON.parse(content);
        // Map product names back to IDs
        const timeline = parsed.timeline.map((item)=>{
            const product = products.find((p)=>p.name === item.productName);
            return {
                productId: product?.id || "",
                productName: item.productName,
                expectedResultsTime: item.expectedResultsTime,
                description: item.description
            };
        });
        // Map product names to IDs in interactions
        const mapProductNamesToIds = (productNames)=>{
            return productNames.map((name)=>{
                const product = products.find((p)=>p.name === name);
                return product?.id;
            }).filter((id)=>!!id);
        };
        const conflicts = parsed.interactions.conflicts.map((conflict)=>({
                productIds: mapProductNamesToIds(conflict.productNames),
                reason: conflict.reason,
                recommendation: conflict.recommendation
            }));
        const synergies = parsed.interactions.synergies.map((synergy)=>({
                productIds: mapProductNamesToIds(synergy.productNames),
                benefit: synergy.benefit,
                description: synergy.description
            }));
        return {
            timeline,
            interactions: {
                conflicts,
                synergies
            },
            recommendations: parsed.recommendations,
            overallTimeline: parsed.overallTimeline
        };
    } catch (error) {
        console.error("OpenAI analysis error:", error);
        throw error;
    }
}
async function fetchProductIngredients({ name, brand, category, description }) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API key");
    }
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
                content: "You are a concise skincare ingredient expert who only responds with comma-separated ingredient lists."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.4
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
        throw new Error("No ingredient response from OpenAI");
    }
    return content.replace(/^Ingredients:\s*/i, "");
}
}),
"[project]/app/api/products/ingredients/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$openai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/openai.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const body = await request.json();
        const { name, brand, category, description } = body;
        if (!name) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Product name is required for ingredient lookup"
            }, {
                status: 400
            });
        }
        const ingredients = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$openai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchProductIngredients"])({
            name,
            brand,
            category,
            description
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ingredients
        });
    } catch (error) {
        console.error("Ingredient fetch error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || "Unable to fetch ingredients right now."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0255d9b8._.js.map