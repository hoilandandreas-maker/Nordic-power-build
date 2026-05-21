// AI personal-trainer agent for Nordic Power Build.
// Proxies the Claude API so the API key is never exposed to the browser.
// Requires the ANTHROPIC_API_KEY environment variable to be set in Netlify.

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_INSTRUCTIONS = `Du er en erfaren personlig trener og styrkecoach inne i treningsappen "Nordic Power Build".
Brukeren trener etter et ukesbasert program med en progresjonsmodell. Du hjelper med å:
- forklare og justere programmet og progresjonen
- foreslå øvelsesvalg, sett/reps og når deload trengs
- tolke loggført framgang (estimert 1RM, toppsett, volum) og platåer
- svare på trenings- og teknikkspørsmål

Retningslinjer:
- Svar kort og konkret på norsk. Bruk enkel formatering.
- Baser råd på brukerens faktiske data som ligger i konteksten.
- Når du vil endre noe i appen, bruk verktøyene. Brukeren ser et forslag og bekrefter selv – ikke anta at endringen er gjennomført.
- Ikke gi medisinske råd. Ved smerte eller skade, anbefal å kontakte helsepersonell.
- Foreslå aldri mer enn én programendring av gangen uten at brukeren ber om det.`;

const TOOLS = [
  {
    name: "update_one_rep_max",
    description: "Oppdater brukerens estimerte 1RM (én rep maks) for hovedløftene. Oppgi kun løftene som skal endres.",
    input_schema: {
      type: "object",
      properties: {
        squat: { type: "number", description: "Ny 1RM for knebøy i kg" },
        bench: { type: "number", description: "Ny 1RM for benkpress i kg" },
        deadlift: { type: "number", description: "Ny 1RM for markløft i kg" },
      },
    },
  },
  {
    name: "recommend_scheme",
    description: "Anbefal en progresjonsmodell. 'npb' = 12-ukers styrkeblokk, 'linear' = lineær progresjon, 'hypertrofi' = hypertrofiblokk, 'custom' = egendefinert som brukeren redigerer selv.",
    input_schema: {
      type: "object",
      properties: {
        scheme: { type: "string", enum: ["npb", "linear", "hypertrofi", "custom"] },
        reason: { type: "string", description: "Kort begrunnelse til brukeren" },
      },
      required: ["scheme", "reason"],
    },
  },
  {
    name: "set_program",
    description: "Foreslå et nytt komplett ukesprogram. Erstatter dagene i programmet. Bruk kun når brukeren ber om et nytt eller omarbeidet program.",
    input_schema: {
      type: "object",
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["legs", "push", "pull", "upper", "lower", "custom"] },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "string" },
                    reps: { type: "string" },
                    mainLift: { type: "string", enum: ["Squat", "Bench", "Deadlift"], description: "Sett kun for hovedløft" },
                    secondaryDay: { type: "boolean", description: "true = sekundærøkt (-5%)" },
                  },
                  required: ["name", "sets", "reps"],
                },
              },
            },
            required: ["name", "type", "exercises"],
          },
        },
      },
      required: ["days"],
    },
  },
];

function json(status, obj) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

function buildContextText(ctx) {
  const lines = ["Brukerens nåværende data:"];
  lines.push("Uke: " + (ctx.week || "?") + " av " + (ctx.weekCount || "?"));
  lines.push("Progresjonsmodell: " + (ctx.scheme || "?"));
  if (ctx.prs) {
    lines.push(
      "1RM (kg): knebøy " + (ctx.prs.Squat || "?") +
      ", benk " + (ctx.prs.Bench || "?") +
      ", mark " + (ctx.prs.Deadlift || "?")
    );
  }
  if (Array.isArray(ctx.program)) {
    lines.push("Program:");
    ctx.program.forEach((d) => {
      const ex = (d.exercises || [])
        .map((e) => e.name + " " + e.sets + "x" + e.reps + (e.mainLift ? " [" + e.mainLift + "]" : ""))
        .join("; ");
      lines.push("- " + d.name + " (" + d.type + "): " + ex);
    });
  }
  if (ctx.history && Object.keys(ctx.history).length) {
    lines.push("Loggført framgang (uke: est1RM/toppsett/volum):");
    Object.keys(ctx.history).forEach((name) => {
      const pts = ctx.history[name]
        .map((p) => "u" + p.week + " " + Math.round(p.e1rm) + "/" + Math.round(p.top) + "/" + Math.round(p.vol))
        .join(", ");
      lines.push("- " + name + ": " + pts);
    });
  } else {
    lines.push("Ingen loggført treningsdata enda.");
  }
  return lines.join("\n");
}

async function callAnthropic(apiKey, system, messages) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system,
      tools: TOOLS,
      messages,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error((data && data.error && data.error.message) || "API-feil " + resp.status);
  }
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: "ANTHROPIC_API_KEY er ikke konfigurert i Netlify." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Ugyldig forespørsel." });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const ctx = body.context || {};

  const system = [
    { type: "text", text: SYSTEM_INSTRUCTIONS, cache_control: { type: "ephemeral" } },
    { type: "text", text: buildContextText(ctx) },
  ];

  const messages = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content }));

  if (!messages.length) return json(400, { error: "Ingen melding." });

  try {
    const actions = [];
    for (let i = 0; i < 6; i++) {
      const resp = await callAnthropic(apiKey, system, messages);
      if (resp.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: resp.content });
        const results = resp.content
          .filter((c) => c.type === "tool_use")
          .map((tu) => {
            actions.push({ name: tu.name, input: tu.input });
            return {
              type: "tool_result",
              tool_use_id: tu.id,
              content: "Registrert. Brukeren ser forslaget i appen og bekrefter selv.",
            };
          });
        messages.push({ role: "user", content: results });
        continue;
      }
      const reply = resp.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim();
      return json(200, { reply: reply || "(tomt svar)", actions });
    }
    return json(200, { reply: "Coachen brukte for mange steg. Prøv å spørre mer spesifikt.", actions: [] });
  } catch (e) {
    return json(502, { error: "Kunne ikke nå AI-coachen: " + e.message });
  }
};
