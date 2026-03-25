/*
MIT License

Copyright (c) 2026 pazooter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { useState } from "react";

// ── LENSES ────────────────────────────────────────────────────────────────────
const LENSES = [
  { id: 1,  short: "Omitted Data",              full: "What information is missing, withheld, or conspicuously absent from this actor's account? What would we expect to see in the open-source record if this claim were true — and is it there?" },
  { id: 2,  short: "Altered Sequence",           full: "Does the claimed chronology match what the open-source record — timestamps, metadata, satellite passes, upload sequences — actually shows?" },
  { id: 3,  short: "Dropped-Out Time",           full: "Are date and time references absent from a claim where they are essential to evaluate it? Is the claim structured to prevent chronolocation?" },
  { id: 4,  short: "Added Falsehood",            full: "Is this claim directly contradicted by geolocated imagery, verified metadata, cross-referenced open records, or other independently confirmed evidence?" },
  { id: 5,  short: "Altered Importance",         full: "Is the significance of an event or piece of evidence being overstated or understated relative to what the full open-source record shows?" },
  { id: 6,  short: "Contrary Facts",             full: "Does this claim contradict another claim from the same actor — across time, across platforms, or across spokespersons? Does it contradict independent corroborating sources?" },
  { id: 7,  short: "Added Time",                 full: "Does this claim insert a timeline or duration not supported by satellite imagery windows, metadata timestamps, upload logs, or other open-source records?" },
  { id: 8,  short: "Added Inapplicable Data",    full: "Does this claim introduce context, analogies, or causal factors that are irrelevant or misleading — including false historical parallels, misapplied technical standards, or out-of-context imagery?" },
  { id: 9,  short: "Wrong Source",               full: "Is this claim misattributed? Does it rest on a source with known reliability problems, state affiliation, or a documented history of producing manipulated content? Has reverse image search or metadata analysis been applied?" },
  { id: 10, short: "Identities Not Identical",   full: "Does this claim conflate distinct individuals, units, organizations, or accounts as if they were the same entity? Are handles, usernames, or insignia being misidentified?" },
  { id: 11, short: "Similarities Not Similar",   full: "Does this claim treat a visual, structural, or behavioral resemblance as meaningful equivalence? Does a weapon system, vehicle, uniform, or building look like something without being confirmed as it?" },
  { id: 12, short: "Differences Not Different",  full: "Does this claim treat a trivial distinction as if it were operationally, legally, or factually significant? Is a minor variation being used to deflect a more significant finding?" },
  { id: 13, short: "Frame Control",              full: "Does this claim, or the framing surrounding it, limit what hypotheses, actors, or lines of inquiry are permitted to exist in the discourse? Who set this frame and who benefits from its limits?" },
  { id: 14, short: "Wrong Target",               full: "Is this investigation or claim addressing the wrong person, organisation, or location? Is the real source of the problem elsewhere — and is attention being deliberately or accidentally directed away from it?" },
  { id: 15, short: "Generality",                 full: "Is this claim so vague, broad, or unattributed that it cannot be verified or falsified? Does it use 'everyone', 'always', 'they', 'sources say' or other language that prevents pinning the claim to a specific actor, time, or place?" },
  { id: 16, short: "False Report",               full: "Is data being introduced into the record that is factually untrue — not merely spun or framed, but concretely wrong — and is that false data being used as the basis for further claims or decisions?" },
];

const PRESETS = [
  { label: "Airstrike attribution", text: "A government spokesperson stated that an airstrike on a residential building was carried out by opposition forces using improvised munitions, and released a single photograph taken at an unspecified time showing damage consistent with that claim." },
  { label: "Satellite image claim", text: "A state media outlet published satellite imagery it claimed showed a foreign military buildup on its border, dated to the current week, as evidence of an imminent invasion. The images were not independently verified and no metadata was released." },
  { label: "Social media atrocity video", text: "A widely shared video purports to show security forces executing civilians in a named town on a specific date. The account that posted it was created two days before the upload, has no prior posting history, and the location has not been independently geolocated." },
  { label: "Disinformation network denial", text: "A platform spokesperson denied that a coordinated inauthentic behavior network linked to a specific state actor had been removed, stating the accounts were taken down solely for terms-of-service violations unrelated to influence operations." },
];

const STATUS_STYLES = {
  warn:  { tag: { background: "#fde8e8", color: "#a32d2d" }, pill: { background: "#fde8e8", color: "#a32d2d", border: "0.5px solid #f09595" }, icon: "⚠" },
  maybe: { tag: { background: "#faeeda", color: "#854f0b" }, pill: { background: "#faeeda", color: "#854f0b", border: "0.5px solid #ef9f27" }, icon: "?" },
  clean: { tag: { background: "#eaf3de", color: "#3b6d11" }, pill: { background: "#eaf3de", color: "#3b6d11", border: "0.5px solid #97c459" }, icon: "~" },
};

// ── PROMPTS ───────────────────────────────────────────────────────────────────

const CLARIFICATION_SYSTEM = `You are a Lensmen intake analyst. Your job is to assess whether the user's input is specific enough for Lensmen's 16 analytical lenses to grip — and if not, to ask exactly one sharp focusing question that will convert it into something concrete.

Lensmen works best on inputs that have: a specific actor, decision, event, or claim; a documentable or public record; and a subject that can be measured against an Ideal Scene.

Lensmen works poorly on: open-ended questions about desired futures ("how can X thrive?"), vague aspirational queries, or questions with no specific claim or actor to investigate.

ASSESSMENT:
- If the input IS specific enough (a claim, an event, a decision, an actor, something with a record): respond with {"needs_clarification": false}
- If the input IS NOT specific enough: respond with {"needs_clarification": true, "question": "..."}

The clarifying question must:
- Be a single sharp question, not multiple questions
- Offer concrete examples or options where helpful to guide the user toward a specific claim
- Convert the vague input into something with an actor, decision, or documentable event
- Be no longer than 2 sentences

Examples:
- Input: "How can Waterville, WA thrive better as a viable community?" → {"needs_clarification": true, "question": "Are you investigating a specific obstacle to Waterville's viability — a decision, a policy, a person or organization, a missed opportunity — or would you like to focus on a particular domain such as economic development, infrastructure, or local governance?"}
- Input: "A government spokesperson claimed the airstrike was carried out by opposition forces." → {"needs_clarification": false}
- Input: "Why is my town struggling?" → {"needs_clarification": true, "question": "Can you name a specific decision, policy, person, organization, or event you believe is contributing to the struggle — for example, a council vote, a business closure, a funding cut, or a particular official's actions?"}

Respond ONLY with valid JSON, straight double quotes, no markdown.`;

const IDEAL_SCENE_SYSTEM = `You are a Lensmen analyst assistant. Your only job is to infer the Ideal Scene from the user's query.

The Ideal Scene is a single short declarative sentence stating the best positive, aspirational-but-achievable condition implied by the query — how things would look at their most successful, coherent, and fully realised if the premise of the question were correct. It should lean optimistic and specific, not neutral or cautious.

Examples:
- Query: "Why did The Surfaris' success fade after Wipe Out?" → Ideal Scene: "The Surfaris build on the runaway success of Wipe Out to achieve lasting chart presence, loyal fans, and a thriving career across the decade."
- Query: "A government spokesperson claimed the airstrike was carried out by opposition forces." → Ideal Scene: "The airstrike's origin is fully attributable through multiple independent sources and a clear, verifiable chain of evidence."
- Query: "Why did the platform only remove the accounts for terms-of-service violations?" → Ideal Scene: "The platform applies its enforcement policies with complete transparency and consistency across all account types and political affiliations."

EVAL/INEVAL: Return ONLY the Ideal Scene sentence. Do not add commentary, caveats, or explanation. Do not omit the positive framing.`;

const DATA_SCOPE_SYSTEM = `You are a Lensmen analyst. You have a claim and a confirmed Ideal Scene. Define the scoped data brief — specific categories of information relevant to evaluating the existing scene against the Ideal Scene.

Each category must be:
- Specific and actionable (not "general information" but "Dot Records internal promotional memos 1963-1966")
- Scoped to the subject, time period, and people involved
- Inclusive of the full human network: principals AND everyone in orbit (managers, label staff, family, rivals, journalists, collaborators, etc)

EVAL/INEVAL: Produce exactly 8-12 numbered items. One line each. Include only what is directly relevant to this specific claim and Ideal Scene. Do not add general investigative advice. Do not omit human network nodes.

Return ONLY the numbered list.`;

const ANALYSIS_SYSTEM = `You are a Lensmen analyst operating under full Data Series discipline. You have a claim, a confirmed Ideal Scene, and a confirmed data scope. Apply analytical lenses to find NUTTINESSES — specific things in the known record that don't add up against the Ideal Scene baseline.

EVAL/INEVAL RULE: Apply only what each lens actually asks. Do not add interpretation beyond what the lens requires. Do not omit a lens finding because the subject seems unrelated — every lens must produce a finding.

LENSES FIND FRICTION — NOT VERDICTS:
Each lens detects a specific type of nuttiness. Find something concrete that doesn't make sense — a statement contradicting a fact, a timeline misalignment, a framing that serves someone, a relationship gap, a vague claim that can't be pinned down. Lens 1 (Omitted Data) flags absences. Every other lens finds friction in what IS known.

NEVER conclude, confirm, or refute. Every finding points outward.

HUMAN NETWORK: Map everyone in orbit silently first. Peripheral figures' contradictions are findings. Absent testimony from someone who should have spoken is a finding.

STATUS:
"warn" = specific nuttiness present, needs explaining — name it precisely
"maybe" = possible nuttiness, one data point away from confirming — name what
"clean" = no friction on this lens — state exactly what confirms that

For each lens:
- lens_id, lens_name, status
- headline: one sharp sentence naming the nuttiness, max 12 words, never a verdict
- detail: 2-3 sentences. Name the specific friction — people, dates, statements, events. Never conclude.
- next_action: one concrete step — person, archive, record type, or method

Respond ONLY with valid JSON, straight double quotes, no markdown.
Format: {"findings":[{"lens_id":1,"lens_name":"...","status":"...","headline":"...","detail":"...","next_action":"..."}],"lines_opened":"2 sentences naming the most specific nuttinesses or people worth pulling next."}`;

const PRIMARY_NUTTINESS_SYSTEM = `You are a Lensmen analyst applying Data Series discipline. You have a set of lens findings from an investigation. Your job is to identify the PRIMARY NUTTINESS — the single most senior outpoint that, if resolved, would most likely explain or unlock the other findings.

In the Data Series, the primary nuttiness is the one that is causatively senior to the rest. It is not necessarily the most dramatic finding — it is the one whose resolution would collapse or explain the most other anomalies.

Produce:
1. PRIMARY NUTTINESS: One sentence naming the specific finding that is most senior.
2. WHY IT IS SENIOR: 2-3 sentences explaining why resolving this one would unlock the others.
3. THE WHY: Your best current assessment of WHY the existing scene diverges from the Ideal Scene — the root cause hypothesis. This is not a conclusion; it is the most productive line to pull. Frame it as: "The most likely explanation requiring investigation is..." 
4. NEXT MOVE: The single most important investigative action to take right now.

EVAL/INEVAL: Base this only on the findings provided. Do not introduce new claims. Do not conclude — the Why is a hypothesis to investigate, not a verdict.

Respond ONLY with valid JSON, straight double quotes, no markdown.
Format: {"primary_nuttiness":"...","why_senior":"...","the_why":"...","next_move":"..."}`;

const PURSUE_SCOPE_SYSTEM = `You are a Lensmen analyst. An investigator is pulling a specific thread. Define a targeted data scope for this outpoint.

Produce 4-6 specific data categories or person types directly relevant to THIS thread. Name record types, archives, roles, relationships, time periods. Include human network nodes specific to this thread.

EVAL/INEVAL: Include only what is directly relevant to this specific thread. Do not pad with general investigative categories.

Return ONLY the numbered list.`;

// ── API ───────────────────────────────────────────────────────────────────────

async function callAPI(system, userContent, maxTokens = 300) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "API error");
  return data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
}

async function checkClarification(claim) {
  const text = await callAPI(CLARIFICATION_SYSTEM, claim, 200);
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return { needs_clarification: false };
  return JSON.parse(text.slice(start, end + 1));
}

async function generateIdealScene(claim) {
  return callAPI(IDEAL_SCENE_SYSTEM, claim, 120);
}

async function generateDataScope(claim, idealScene) {
  return callAPI(DATA_SCOPE_SYSTEM, `CLAIM:\n${claim}\n\nIDEAL SCENE:\n${idealScene}`, 700);
}

async function runLensAnalysis(claim, idealScene, dataScope, lenses) {
  const lensDescriptions = lenses.map(l => `Lens ${l.id} (${l.short}): ${l.full}`).join("\n");
  const userPrompt = `CLAIM:\n${claim}\n\nIDEAL SCENE:\n${idealScene}\n\nCONFIRMED DATA SCOPE:\n${dataScope}\n\nAPPLY THESE LENSES:\n${lensDescriptions}`;
  const text = await callAPI(ANALYSIS_SYSTEM, userPrompt, 8000);
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(text.slice(start, end + 1));
}

async function generatePrimaryNuttiness(findings, idealScene, claim) {
  const findingsSummary = findings
    .filter(f => f.status !== "clean")
    .map(f => `[${f.status}] Lens ${f.lens_id} (${f.lens_name}): ${f.headline} — ${f.detail}`)
    .join("\n");
  const userPrompt = `CLAIM:\n${claim}\n\nIDEAL SCENE:\n${idealScene}\n\nFINDINGS:\n${findingsSummary}`;
  const text = await callAPI(PRIMARY_NUTTINESS_SYSTEM, userPrompt, 800);
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in primary nuttiness response");
  return JSON.parse(text.slice(start, end + 1));
}

async function generatePursueScope(claim, idealScene, thread) {
  return callAPI(PURSUE_SCOPE_SYSTEM,
    `ORIGINAL CLAIM:\n${claim}\n\nIDEAL SCENE:\n${idealScene}\n\nTHREAD:\n${thread}`, 500);
}

async function selectRelevantLenses(claim, priorContext) {
  const system = `Select the 4-6 most relevant lens IDs for this follow-up. Return ONLY a JSON array of numbers e.g. [1,4,6,9,13]. No other text.\nLenses:\n${LENSES.map(l => `${l.id}: ${l.short}`).join("\n")}`;
  try {
    const text = await callAPI(system, `CONTEXT:\n${priorContext}\n\nFOLLOW-UP:\n${claim}`, 80);
    const ids = JSON.parse(text);
    return LENSES.filter(l => ids.includes(l.id));
  } catch { return LENSES.slice(0, 6); }
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function FlagCard({ finding, onPursue, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const s = STATUS_STYLES[finding.status] || STATUS_STYLES.clean;
  return (
    <div style={{ border: "0.5px solid #d3d1c7", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f5f5f2", cursor: "pointer" }}>
        <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>{s.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6, flexShrink: 0, whiteSpace: "nowrap", ...s.tag }}>
          Lens {finding.lens_id} — {finding.lens_name}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", flex: 1 }}>{finding.headline}</span>
        <span style={{ fontSize: 11, color: "#888780", flexShrink: 0, transform: open ? "rotate(90deg)" : "none" }}>▶</span>
      </div>
      {open && (
        <div style={{ padding: "10px 12px 12px", fontSize: 13, lineHeight: 1.7, color: "#5f5e5a", borderTop: "0.5px solid #d3d1c7", background: "#fff" }}>
          <p>{finding.detail}</p>
          {finding.next_action && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <p style={{ flex: 1, fontSize: 12, color: "#888780", borderLeft: "2px solid #d3d1c7", paddingLeft: 8, margin: 0 }}>
                Next action: {finding.next_action}
              </p>
              {onPursue && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPursue(`Lens ${finding.lens_id} — ${finding.lens_name}: ${finding.headline}. ${finding.next_action}`); }}
                  style={{ flexShrink: 0, background: "#fde8e8", border: "0.5px solid #f09595", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#a32d2d", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  Pull thread ↗
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrimaryNutsinessBlock({ pn, onPursue }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#fff8f0", border: "1.5px solid #ef9f27", borderRadius: 12, padding: "1rem 1.25rem", marginTop: 16 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: open ? 12 : 0 }}>
        <span style={{ fontSize: 16 }}>🔎</span>
        <p style={{ fontSize: 11, color: "#854f0b", letterSpacing: "0.04em", fontWeight: 600, flex: 1, margin: 0 }}>PRIMARY NUTTINESS</p>
        <span style={{ fontSize: 11, color: "#888780", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
      </div>
      {open && (
        <>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18", marginBottom: 10, lineHeight: 1.6 }}>{pn.primary_nuttiness}</p>
          <p style={{ fontSize: 12, color: "#888780", letterSpacing: "0.04em", marginBottom: 4 }}>WHY IT IS SENIOR</p>
          <p style={{ fontSize: 13, color: "#5f5e5a", lineHeight: 1.7, marginBottom: 12 }}>{pn.why_senior}</p>
          <p style={{ fontSize: 12, color: "#888780", letterSpacing: "0.04em", marginBottom: 4 }}>THE WHY — ROOT CAUSE HYPOTHESIS</p>
          <p style={{ fontSize: 13, color: "#5f5e5a", lineHeight: 1.7, marginBottom: 12, fontStyle: "italic" }}>{pn.the_why}</p>
          <p style={{ fontSize: 12, color: "#888780", letterSpacing: "0.04em", marginBottom: 4 }}>NEXT MOVE</p>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <p style={{ fontSize: 13, color: "#1a1a18", lineHeight: 1.7, flex: 1, margin: 0 }}>{pn.next_move}</p>
            {onPursue && (
              <button
                onClick={() => onPursue(`Primary nuttiness: ${pn.primary_nuttiness}. Next move: ${pn.next_move}`)}
                style={{ flexShrink: 0, background: "#faeeda", border: "0.5px solid #ef9f27", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#854f0b", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", fontWeight: 500 }}
              >
                Pull this ↗
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AnalysisBlock({ result, primaryNuttiness, onPursue, label, showPrimary }) {
  const warnCount  = result.findings.filter(f => f.status === "warn").length;
  const maybeCount = result.findings.filter(f => f.status === "maybe").length;
  const cleanCount = result.findings.filter(f => f.status === "clean").length;
  return (
    <div>
      {label && <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.04em", marginBottom: 10 }}>{label}</p>}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {warnCount  > 0 && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, ...STATUS_STYLES.warn.pill  }}>⚠ {warnCount} nuttiness{warnCount !== 1 ? "es" : ""}</span>}
        {maybeCount > 0 && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, ...STATUS_STYLES.maybe.pill }}>? {maybeCount} possible</span>}
        {cleanCount > 0 && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, ...STATUS_STYLES.clean.pill }}>~ {cleanCount} verify</span>}
      </div>
      {result.findings.map((f, i) => (
        <FlagCard key={`${f.lens_id}-${i}`} finding={f} defaultOpen={i === 0} onPursue={onPursue} />
      ))}
      {result.lines_opened && (
        <div style={{ background: "#f1efe8", border: "0.5px solid #b4b2a9", borderRadius: 12, padding: "1rem 1.25rem", marginTop: 10 }}>
          <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.04em", marginBottom: 8 }}>THREADS TO PULL</p>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "#1a1a18", marginBottom: 12 }}>{result.lines_opened}</p>
          <button
            onClick={() => onPursue && onPursue(result.lines_opened)}
            style={{ background: "#fde8e8", border: "0.5px solid #f09595", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#a32d2d", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
          >
            Pull this thread ↗
          </button>
        </div>
      )}
      {showPrimary && primaryNuttiness && (
        <PrimaryNutsinessBlock pn={primaryNuttiness} onPursue={onPursue} />
      )}
    </div>
  );
}

function ScopeBlock({ scope, onScopeChange, onConfirm, loading, readOnly, confirmLabel }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #c8c6be", borderRadius: 8, padding: "14px 16px", marginTop: 12 }}>
      <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", marginBottom: 4 }}>DATA SCOPE</p>
      <p style={{ fontSize: 12, color: "#888780", marginBottom: 10, lineHeight: 1.6 }}>
        Specific data categories and people relevant to this investigation. Amend if needed, then confirm.
      </p>
      <textarea
        value={scope}
        onChange={e => onScopeChange && onScopeChange(e.target.value)}
        readOnly={readOnly}
        rows={8}
        style={{
          width: "100%", background: readOnly ? "#f1efe8" : "#f9f8f5",
          border: "0.5px solid #d3d1c7", borderRadius: 6, padding: "9px 12px",
          fontSize: 13, color: "#1a1a18", fontFamily: "inherit", lineHeight: 1.7,
          resize: "vertical", outline: "none", boxSizing: "border-box",
        }}
      />
      {!readOnly && !loading && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <button onClick={onConfirm} style={{
            background: "#1a1a18", border: "none", borderRadius: 8,
            padding: "7px 18px", fontSize: 13, color: "#fff", cursor: "pointer", fontFamily: "inherit",
          }}>{confirmLabel || "Confirm & Analyze ↗"}</button>
          <span style={{ fontSize: 12, color: "#888780" }}>Amend above if needed</span>
        </div>
      )}
      {loading && <p style={{ marginTop: 10, fontSize: 13, color: "#888780" }}>Applying lenses...</p>}
    </div>
  );
}

function PursueBlock({ entry, onPursue }) {
  return (
    <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: "2px solid #f09595" }}>
      <div style={{ background: "#fde8e8", border: "0.5px solid #f09595", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#a32d2d", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#a32d2d", display: "block", marginBottom: 2, opacity: 0.7 }}>THREAD</span>
        {entry.thread}
      </div>
      {entry.stage === "scope_loading" && (
        <div style={{ padding: "10px 12px", background: "#f1efe8", borderRadius: 8, fontSize: 13, color: "#888780" }}>Scoping investigation...</div>
      )}
      {(entry.stage === "scope_ready" || entry.stage === "analysis_loading" || entry.stage === "done") && (
        <ScopeBlock
          scope={entry.scope}
          onScopeChange={entry.onScopeEdit}
          onConfirm={entry.onConfirm}
          loading={entry.stage === "analysis_loading"}
          readOnly={entry.stage === "done"}
          confirmLabel="Confirm & Pull Thread ↗"
        />
      )}
      {entry.error && (
        <div style={{ padding: "10px 12px", background: "#fde8e8", borderRadius: 8, fontSize: 13, color: "#a32d2d", marginTop: 8 }}>Error: {entry.error}</div>
      )}
      {entry.stage === "done" && entry.result && (
        <div style={{ marginTop: 12 }}>
          <AnalysisBlock
            result={entry.result}
            primaryNuttiness={entry.primaryNuttiness}
            onPursue={onPursue}
            showPrimary={true}
          />
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function Lensmen() {
  const [mode, setMode] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set(LENSES.map(l => l.id)));
  const [claim, setClaim] = useState("");
  const [stage, setStage] = useState("idle");
  // idle | clarification_loading | clarification_ready
  // | ideal_scene_loading | ideal_scene_ready
  // | data_scope_loading | data_scope_ready | analysis_loading
  // | primary_loading | done

  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [clarificationAnswer,   setClarificationAnswer]   = useState("");
  const [sharpened,             setSharpened]             = useState(""); // final claim used for analysis
  const [idealScene,            setIdealScene]            = useState("");
  const [dataScope,             setDataScope]             = useState("");
  const [result,                setResult]                = useState(null);
  const [primaryNuttiness,      setPrimaryNuttiness]      = useState(null);
  const [error,                 setError]                 = useState(null);
  const [pursues,               setPursues]               = useState([]);
  const [followUpInput,         setFollowUpInput]         = useState("");
  const [followUpLoading,       setFollowUpLoading]       = useState(false);

  const activeLenses = mode === "select" ? LENSES.filter(l => selectedIds.has(l.id)) : LENSES;

  const toggleLens = id => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const reset = () => {
    setStage("idle");
    setClarificationQuestion(""); setClarificationAnswer(""); setSharpened("");
    setIdealScene(""); setDataScope("");
    setResult(null); setPrimaryNuttiness(null); setError(null); setPursues([]);
  };

  // Proceed to Ideal Scene with the final (possibly sharpened) claim
  const proceedToIdealScene = async (finalClaim) => {
    setSharpened(finalClaim);
    setStage("ideal_scene_loading");
    try {
      const scene = await generateIdealScene(finalClaim);
      setIdealScene(scene); setStage("ideal_scene_ready");
    } catch (e) { setError(e.message); setStage("idle"); }
  };

  const handleSubmit = async () => {
    if (!claim.trim()) return;
    setStage("clarification_loading");
    setClarificationQuestion(""); setClarificationAnswer(""); setSharpened("");
    setIdealScene(""); setDataScope(""); setResult(null); setPrimaryNuttiness(null); setError(null); setPursues([]);
    try {
      const result = await checkClarification(claim.trim());
      if (result.needs_clarification) {
        setClarificationQuestion(result.question);
        setStage("clarification_ready");
      } else {
        await proceedToIdealScene(claim.trim());
      }
    } catch (e) {
      // If clarification check fails, proceed anyway
      await proceedToIdealScene(claim.trim());
    }
  };

  const handleConfirmClarification = async () => {
    // Combine original claim + clarification answer into sharpened claim
    const finalClaim = clarificationAnswer.trim()
      ? `${claim.trim()}\n\nAdditional context: ${clarificationAnswer.trim()}`
      : claim.trim();
    await proceedToIdealScene(finalClaim);
  };

  const handleSkipClarification = async () => {
    await proceedToIdealScene(claim.trim());
  };

  const handleConfirmIdealScene = async () => {
    setStage("data_scope_loading");
    try {
      const scope = await generateDataScope(sharpened || claim.trim(), idealScene);
      setDataScope(scope); setStage("data_scope_ready");
    } catch (e) { setError(e.message); setStage("ideal_scene_ready"); }
  };

  const handleConfirmDataScope = async () => {
    setStage("analysis_loading");
    try {
      const data = await runLensAnalysis(sharpened || claim.trim(), idealScene, dataScope, activeLenses);
      setResult(data);
      setStage("primary_loading");
      try {
        const pn = await generatePrimaryNuttiness(data.findings, idealScene, sharpened || claim);
        setPrimaryNuttiness(pn);
      } catch (_) {}
      setStage("done");
    } catch (e) { setError(e.message); setStage("data_scope_ready"); }
  };

  const handlePursue = async (thread) => {
    setFollowUpLoading(true);
    const id = Date.now();
    const update = patch => setPursues(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    const baseClaim = sharpened || claim;

    setPursues(prev => [...prev, { id, thread, scope: "", stage: "scope_loading", result: null, primaryNuttiness: null, error: null, onScopeEdit: null, onConfirm: null }]);

    try {
      const scope = await generatePursueScope(baseClaim, idealScene, thread);
      const relevantLenses = await selectRelevantLenses(thread, `Claim: ${baseClaim}\nIdeal Scene: ${idealScene}\nThread: ${thread}`);
      const captured = { scope };

      const confirmHandler = async () => {
        update({ stage: "analysis_loading" });
        try {
          const res = await runLensAnalysis(
            `ORIGINAL CLAIM: ${baseClaim}\n\nTHREAD: ${thread}`,
            idealScene, captured.scope, relevantLenses
          );
          let pn = null;
          try { pn = await generatePrimaryNuttiness(res.findings, idealScene, thread); } catch (_) {}
          update({ stage: "done", result: res, primaryNuttiness: pn });
        } catch (e) { update({ stage: "scope_ready", error: e.message }); }
      };

      setPursues(prev => prev.map(e => {
        if (e.id !== id) return e;
        return {
          ...e, scope, stage: "scope_ready",
          onScopeEdit: val => { captured.scope = val; update({ scope: val }); },
          onConfirm: confirmHandler,
        };
      }));
    } catch (e) { update({ stage: "done", error: e.message }); }
    setFollowUpLoading(false);
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim()) return;
    const thread = followUpInput.trim();
    setFollowUpInput("");
    handlePursue(thread);
  };

  const modeBtn = (id, label) => (
    <button key={id} onClick={() => setMode(id)} style={{
      background: mode === id ? "#fff" : "#f1efe8",
      border: mode === id ? "0.5px solid #5f5e5a" : "0.5px solid #d3d1c7",
      borderRadius: 8, padding: "5px 12px", fontSize: 12,
      color: mode === id ? "#1a1a18" : "#5f5e5a", fontWeight: mode === id ? 500 : 400,
      cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );

  const busy = ["clarification_loading","ideal_scene_loading","data_scope_loading","analysis_loading","primary_loading"].includes(stage);
  const busyLabel = {
    clarification_loading: "Checking clarity...",
    ideal_scene_loading:   "Deriving ideal scene...",
    data_scope_loading:    "Scoping data...",
    analysis_loading:      "Applying lenses...",
    primary_loading:       "Finding primary nuttiness...",
  }[stage] || "Submit ↗";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif", color: "#1a1a18" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 500 }}>Lensmen</span>
        <span style={{ background: "#fde8e8", color: "#a32d2d", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8 }}>16-LENS ANALYSIS</span>
        <span style={{ background: "#eaf3de", color: "#3b6d11", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8 }}>v5.1</span>
      </div>
      <p style={{ fontSize: 13, color: "#5f5e5a", marginBottom: "1rem" }}>Submit any claim, source, or piece of evidence for open-source analysis</p>

      <div style={{ background: "#fff", border: "0.5px solid #c8c6be", borderRadius: 8, padding: "10px 14px", marginBottom: "1rem", fontSize: 12, color: "#5f5e5a", lineHeight: 1.6 }}>
        Lensmen establishes an <strong>Ideal Scene</strong>, scopes the relevant data, applies 16 analytical lenses to find nuttinesses, then identifies the <strong>Primary Nuttiness</strong> — the senior outpoint most likely to unlock the others — and a root cause hypothesis. Every thread can be pulled further through the same process.
      </div>

      <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", margin: "1.25rem 0 8px" }}>ANALYSIS MODE</p>
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {modeBtn("all", "All 16 lenses")}
        {modeBtn("select", "Select lenses")}
      </div>

      {mode === "select" && (
        <>
          <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", marginBottom: 8 }}>SELECT LENSES</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6, marginBottom: "1rem" }}>
            {LENSES.map(l => (
              <div key={l.id} onClick={() => toggleLens(l.id)} style={{
                background: selectedIds.has(l.id) ? "#fff" : "#f1efe8",
                border: selectedIds.has(l.id) ? "0.5px solid #5f5e5a" : "0.5px solid #d3d1c7",
                borderRadius: 8, padding: "7px 10px", fontSize: 12,
                color: selectedIds.has(l.id) ? "#1a1a18" : "#5f5e5a", cursor: "pointer", lineHeight: 1.4,
              }}>
                <span style={{ fontSize: 10, color: "#888780", display: "block", marginBottom: 2 }}>Lens {l.id}</span>
                {l.short}
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", margin: "1.25rem 0 8px" }}>CLAIM OR EVIDENCE TO EVALUATE</p>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={claim}
          onChange={e => { setClaim(e.target.value); reset(); }}
          placeholder="Paste a claim, statement, question, or any piece of evidence to investigate..."
          style={{
            flex: 1, background: "#f1efe8", border: "0.5px solid #b4b2a9", borderRadius: 8,
            padding: "8px 12px", fontSize: 14, color: "#1a1a18", fontFamily: "inherit",
            resize: "vertical", minHeight: 60, outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={busy || !claim.trim()}
          style={{
            background: "#fff", border: "0.5px solid #b4b2a9", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, color: "#1a1a18", cursor: "pointer",
            alignSelf: "flex-end", whiteSpace: "nowrap", fontFamily: "inherit",
            opacity: (busy || !claim.trim()) ? 0.5 : 1,
          }}
        >{busy ? busyLabel : "Submit ↗"}</button>
      </div>

      <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", margin: "1.25rem 0 8px" }}>EXAMPLE CLAIMS</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setClaim(p.text); reset(); }} style={{
            background: "#fff", border: "0.5px solid #d3d1c7", borderRadius: 8,
            padding: "5px 10px", fontSize: 12, color: "#5f5e5a", cursor: "pointer", fontFamily: "inherit",
          }}>{p.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: "1rem", color: "#a32d2d", fontSize: 13, padding: "1rem", background: "#fde8e8", borderRadius: 8 }}>Error: {error}</div>
      )}

      {/* ── CLARIFICATION STAGE ── */}
      {stage === "clarification_ready" && (
        <div style={{ marginTop: "1.5rem", background: "#fff", border: "1px solid #b4d4f0", borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#2a6099", letterSpacing: "0.05em", marginBottom: 4 }}>ONE CLARIFYING QUESTION</p>
          <p style={{ fontSize: 12, color: "#888780", marginBottom: 10, lineHeight: 1.6 }}>
            Your input is broad enough that the lenses may not grip cleanly. Answer below to sharpen the focus — or skip to proceed as-is.
          </p>
          <p style={{ fontSize: 14, color: "#1a1a18", lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>{clarificationQuestion}</p>
          <textarea
            value={clarificationAnswer}
            onChange={e => setClarificationAnswer(e.target.value)}
            placeholder="Your answer (or leave blank and skip)..."
            rows={3}
            style={{
              width: "100%", background: "#f9f8f5", border: "0.5px solid #d3d1c7",
              borderRadius: 6, padding: "9px 12px", fontSize: 14, color: "#1a1a18",
              fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <button
              onClick={handleConfirmClarification}
              disabled={!clarificationAnswer.trim()}
              style={{
                background: "#1a1a18", border: "none", borderRadius: 8,
                padding: "7px 18px", fontSize: 13, color: "#fff", cursor: "pointer",
                fontFamily: "inherit", opacity: !clarificationAnswer.trim() ? 0.4 : 1,
              }}
            >
              Sharpen & Continue ↗
            </button>
            <button
              onClick={handleSkipClarification}
              style={{
                background: "#fff", border: "0.5px solid #b4b2a9", borderRadius: 8,
                padding: "7px 14px", fontSize: 13, color: "#5f5e5a", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Skip ↗
            </button>
            <span style={{ fontSize: 12, color: "#888780" }}>Skip proceeds with your original input</span>
          </div>
        </div>
      )}

      {/* ── IDEAL SCENE ── */}
      {["ideal_scene_ready","data_scope_loading","data_scope_ready","analysis_loading","primary_loading","done"].includes(stage) && (
        <div style={{ marginTop: "1.5rem", background: "#fff", border: "0.5px solid #c8c6be", borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", marginBottom: 4 }}>IDEAL SCENE</p>
          <p style={{ fontSize: 12, color: "#888780", marginBottom: 10, lineHeight: 1.6 }}>The best positive, achievable condition implied by your claim. Amend if needed, then confirm.</p>
          <textarea
            value={idealScene}
            onChange={e => setIdealScene(e.target.value)}
            readOnly={stage !== "ideal_scene_ready"}
            rows={2}
            style={{
              width: "100%", background: stage === "ideal_scene_ready" ? "#f9f8f5" : "#f1efe8",
              border: "0.5px solid #d3d1c7", borderRadius: 6, padding: "9px 12px",
              fontSize: 14, color: "#1a1a18", fontFamily: "inherit", lineHeight: 1.6,
              resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
          {stage === "ideal_scene_ready" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <button onClick={handleConfirmIdealScene} style={{ background: "#1a1a18", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                Confirm & Scope Data ↗
              </button>
              <span style={{ fontSize: 12, color: "#888780" }}>Amend above if needed</span>
            </div>
          )}
          {stage === "data_scope_loading" && <p style={{ marginTop: 10, fontSize: 13, color: "#888780" }}>Scoping relevant data...</p>}
        </div>
      )}

      {/* ── DATA SCOPE ── */}
      {["data_scope_ready","analysis_loading","primary_loading","done"].includes(stage) && (
        <ScopeBlock
          scope={dataScope}
          onScopeChange={setDataScope}
          onConfirm={handleConfirmDataScope}
          loading={stage === "analysis_loading" || stage === "primary_loading"}
          readOnly={stage === "done"}
          confirmLabel="Confirm & Apply Lenses ↗"
        />
      )}

      {stage === "primary_loading" && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff8f0", border: "0.5px solid #ef9f27", borderRadius: 8, fontSize: 13, color: "#854f0b" }}>
          Identifying primary nuttiness...
        </div>
      )}

      {/* ── RESULTS ── */}
      {stage === "done" && result && (
        <div style={{ marginTop: "1.5rem" }}>
          <AnalysisBlock
            result={result}
            primaryNuttiness={primaryNuttiness}
            onPursue={handlePursue}
            label={`LENS ANALYSIS — ${result.findings.length} LENSES APPLIED`}
            showPrimary={true}
          />

          <div style={{ marginTop: 24, borderTop: "0.5px solid #d3d1c7", paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", marginBottom: 4 }}>PARALLEL THREADS</p>
            <p style={{ fontSize: 12, color: "#888780", marginBottom: 14, lineHeight: 1.6 }}>
              Multiple threads run in parallel — pull as many as the investigation warrants. Each gets its own scope, lenses, and primary nuttiness. Use "Pull thread ↗" on any finding, or open a new thread below.
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: pursues.length > 0 ? 20 : 0 }}>
              <textarea
                value={followUpInput}
                onChange={e => setFollowUpInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFollowUp(); }}}
                placeholder="Name a new thread or outpoint to investigate... (Enter to open)"
                style={{
                  flex: 1, background: "#f1efe8", border: "0.5px solid #b4b2a9", borderRadius: 8,
                  padding: "8px 12px", fontSize: 13, color: "#1a1a18", fontFamily: "inherit",
                  resize: "vertical", minHeight: 44, outline: "none",
                }}
              />
              <button
                onClick={handleFollowUp}
                disabled={followUpLoading || !followUpInput.trim()}
                style={{
                  background: "#fff", border: "0.5px solid #b4b2a9", borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, color: "#1a1a18", cursor: "pointer",
                  alignSelf: "flex-end", whiteSpace: "nowrap", fontFamily: "inherit",
                  opacity: followUpLoading || !followUpInput.trim() ? 0.5 : 1,
                }}
              >{followUpLoading ? "..." : "Open thread ↗"}</button>
            </div>

            {pursues.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: "#888780", letterSpacing: "0.05em", marginBottom: 12 }}>
                  ACTIVE THREADS — {pursues.length}
                </p>
                {pursues.map((entry, idx) => (
                  <div key={entry.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ background: "#a32d2d", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 11, color: "#888780", letterSpacing: "0.04em" }}>THREAD {idx + 1}</span>
                    </div>
                    <PursueBlock entry={entry} onPursue={handlePursue} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
