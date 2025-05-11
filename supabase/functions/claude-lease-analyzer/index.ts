/**
 * Lease Analyzer – Claude 3 Sonnet + server-side PDF text extraction
 * Supabase Edge Function  (Deno runtime)
 *
 * 2025-05-11
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import * as pdfjs from "npm:pdfjs-dist@4/legacy/build/pdf.js";
import Anthropic from "@anthropic-ai/sdk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"), // <-- store in Supabase secrets
});

/* ------------------------------------------------------------------ */
/*  1.  Helpers                                                       */
/* ------------------------------------------------------------------ */

async function pdfBytesToText(bytes: Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const txt = await page.getTextContent();
    out += txt.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return out.trim().replace(/\s+/g, " ");
}

function generateDefault(): any {
  return {
    summary:
      "We couldn't fully analyze this lease document. Please verify key details manually.",
    financial: { rent: { amount: null, frequency: "monthly" } },
    term: {},
    parties: {},
    extractionConfidence: { rent: "low" },
  };
}

/* ------------------------------------------------------------------ */
/*  2.  Claude function-calling schema                                */
/* ------------------------------------------------------------------ */

const schema = {
  name: "extractLeaseDetails",
  description: "Structured lease data",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string" },
      financial: {
        type: "object",
        properties: {
          rent: {
            type: "object",
            properties: {
              amount: { type: "number" },
              frequency: {
                type: "string",
                enum: ["monthly", "weekly", "yearly"],
              },
            },
            required: ["amount", "frequency"],
          },
          securityDeposit: { type: "number" },
        },
      },
      term: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
      parties: {
        type: "object",
        properties: {
          landlord: { type: "string" },
          tenants: { type: "array", items: { type: "string" } },
        },
      },
    },
    required: ["summary", "financial"],
  },
};

/* ------------------------------------------------------------------ */
/*  3.  Edge handler                                                  */
/* ------------------------------------------------------------------ */

serve(async (req) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json(); // client sends JSON

    let leaseText = "";

    /* a) If client sent base-64 PDF bytes */
    if (body.documentBytes) {
      const bytes = Uint8Array.from(
        atob(body.documentBytes),
        (c) => c.charCodeAt(0),
      );
      leaseText = await pdfBytesToText(bytes);
    }
    /* b) Fallback to plain text string */
    else if (body.documentText) {
      leaseText = body.documentText;
    } else {
      return new Response(
        JSON.stringify({ error: "No document provided" }),
        { status: 400, headers: cors },
      );
    }

    /* ----------------------------------------------------------------
       3.1  Call Claude 3 Sonnet with function-calling
    ----------------------------------------------------------------- */
    const claude = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      tools: [{ type: "function", function: schema }],
      tool_choice: "auto",
      messages: [
        {
          role: "system",
          content:
            "You are an expert lease-analysis assistant. Extract data per the provided JSON schema. If a field is absent in the text, return null for that field. Do NOT invent.",
        },
        { role: "user", content: leaseText.slice(0, 20000) }, // Sonnet 200 k context is plenty
      ],
    });

    const toolUse = claude.choices[0].message.content.find(
      (c: any) => c.type === "tool_use",
    );

    let payload = generateDefault();

    if (toolUse) {
      payload = JSON.parse(toolUse.arguments);
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: cors },
    );
  }
});
