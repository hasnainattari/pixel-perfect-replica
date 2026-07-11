// AI Triage Edge Function
// Analyses a public complaint and returns structured triage JSON.
// Uses Lovable AI Gateway (no user-provided key required).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a maintenance triage assistant for a facility management platform.
Given a complaint about a physical asset (projectors, AC units, generators, machinery, etc.), return STRICT JSON only.
NEVER include markdown fences, prose, or explanations outside the JSON.

Safety rules (non-negotiable):
- For anything involving electrical, gas, fire, structural, or mechanical high-risk hazards, ALWAYS recommend contacting a qualified technician.
- "initial_checks" MUST only include safe, non-invasive steps (visual inspection, listening, unplug/replug, check indicator lights, verify power source). Never suggest opening equipment, touching wiring, or bypassing safety features.
- If the description suggests immediate danger (smoke, sparks, gas smell, exposed wiring), set priority to "critical".

Return JSON with this exact shape:
{
  "title": "short imperative title (<70 chars)",
  "category": "one of: Electrical, Mechanical, Cooling, Heating, Software/Firmware, Plumbing, Structural, Consumables, Other",
  "priority": "low" | "medium" | "high" | "critical",
  "possible_causes": ["2-4 plausible causes"],
  "initial_checks": ["2-4 safe first-look steps"],
  "recurring_pattern_warning": string | null
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const { complaint, asset_name, category, location, condition } = await req.json();
    if (!complaint || typeof complaint !== "string") {
      return json({ error: "complaint is required" }, 400);
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI gateway not configured" }, 500);

    const userMsg = `Asset: ${asset_name ?? "unknown"} (${category ?? "n/a"})
Location: ${location ?? "n/a"}
Known condition: ${condition ?? "n/a"}

Complaint: ${complaint}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("AI gateway error", res.status, txt);
      if (res.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "AI request failed" }, 500);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return json({ error: "Empty AI response" }, 500);

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(content); } catch {
      return json({ error: "AI returned invalid JSON" }, 500);
    }

    // Validate shape
    const priorities = ["low", "medium", "high", "critical"];
    const safe = {
      title: String(parsed.title ?? "").slice(0, 120) || "Issue reported",
      category: String(parsed.category ?? "Other"),
      priority: priorities.includes(String(parsed.priority)) ? String(parsed.priority) : "medium",
      possible_causes: Array.isArray(parsed.possible_causes) ? parsed.possible_causes.slice(0, 6).map(String) : [],
      initial_checks: Array.isArray(parsed.initial_checks) ? parsed.initial_checks.slice(0, 6).map(String) : [],
      recurring_pattern_warning: parsed.recurring_pattern_warning ? String(parsed.recurring_pattern_warning) : null,
    };
    return json(safe);
  } catch (e) {
    console.error(e);
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
