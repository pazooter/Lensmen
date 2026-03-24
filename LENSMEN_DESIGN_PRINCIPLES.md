# Lensmen — Developer Design Principles
### What This Tool Is, Why It Works, and What Must Not Be Broken

---

## What Lensmen Actually Is

Lensmen is not a chatbot with filters. It is not a prompt wrapper. It is not a "ask AI about a claim" tool.

It is a **structured analytical discipline** implemented as software — a methodology for finding what doesn't add up in any claim, source, or piece of evidence, without ever rendering a verdict.

The distinction matters. Every design decision in Lensmen flows from the methodology, not from UI convention or user convenience. Developers who treat it as a chatbot will make the wrong decisions at every turn.

The methodology comes from the **Data Series** — a framework for diagnosing why something isn't working by finding the most senior anomaly (the "primary nuttiness") that, if resolved, would explain or unlock all the others.

---

## The Four Stages — Non-Negotiable Sequence

Lensmen runs in exactly four stages, in exactly this order. **This sequence is the product.** Shortcutting or reordering it destroys the analytical discipline.

### Stage 1: Ideal Scene
Before any analysis begins, Lensmen establishes the best positive, achievable condition implied by the claim — how things would look if everything were coherent and fully realised. This is not a neutral baseline. It leans optimistic and specific.

**Why this cannot be skipped:** Without an Ideal Scene, the lenses have no reference point. Analysis becomes a list of suspicions rather than a measurement of divergence. The Ideal Scene is what makes every finding meaningful — it answers "different from what?"

**What breaks it:** Skipping directly to analysis. Generating a generic or cautious Ideal Scene. Letting users bypass it. Making it a hidden internal step rather than a visible, editable element.

### Stage 2: Data Scope
Once the Ideal Scene is confirmed, Lensmen generates a targeted list of specific data categories, record types, and human network nodes relevant to this specific claim. 8-12 items. One line each. Specific and actionable.

**Why this cannot be skipped:** The lenses need a defined investigative universe. Without a scope, the analysis floats free — it becomes generic commentary rather than targeted friction-finding. The scope also forces inclusion of the full human network: not just principals, but everyone in orbit.

**What breaks it:** Generic scope items. Skipping scope entirely. Making scope invisible to the user. Removing the user's ability to amend the scope before proceeding.

### Stage 3: Lens Analysis
Sixteen analytical lenses are applied to the claim against the Ideal Scene within the confirmed data scope. Each lens detects a specific type of nuttiness — not a verdict, but a concrete friction point that needs explaining.

**Why the lenses must find friction, not conclusions:** The entire value of Lensmen is that it points outward. Every finding is a thread to pull, not a case closed. A lens that concludes has failed. A lens that names a specific person, date, statement, or gap that doesn't add up has succeeded.

**The three statuses mean specific things:**
- `warn` — specific nuttiness present, needs explaining. Name it precisely.
- `maybe` — possible nuttiness, one data point away from confirming. Name what's missing.
- `clean` — no friction on this lens. State exactly what confirms that.

**What breaks it:** Turning lens findings into verdicts. Collapsing multiple lenses into a summary. Removing lenses because they seem irrelevant to the subject. Making lens findings non-expandable. Removing the "Pull thread" action from individual findings.

### Stage 4: Primary Nuttiness
A separate analytical pass across all non-clean findings to identify the single most **causatively senior** outpoint — the one whose resolution would most likely explain or unlock the others. This is accompanied by a root cause hypothesis ("The most likely explanation requiring investigation is...") and a single next move.

**Why "causatively senior" is the right frame:** The primary nuttiness is not necessarily the most dramatic finding. It is the one that, if resolved, collapses or explains the most other anomalies. This distinction is critical. A developer who treats it as "most important finding" will generate the wrong output.

**What breaks it:** Treating the primary nuttiness as a verdict. Generating it from all findings rather than only non-clean findings. Making it a summary of the analysis rather than a specific actionable outpoint.

---

## Thread Architecture — The Investigative Tree

Every finding, every primary nuttiness, and every lines-opened suggestion can be "pulled" into a parallel thread. Each thread runs the full Lensmen pipeline independently: its own scope, its own lenses, its own primary nuttiness.

**Why threads must be parallel, not sequential:** Investigations branch. A finding on Lens 9 (Wrong Source) may open a completely different line than the primary nuttiness. Both deserve full treatment simultaneously. Serial threading would force artificial prioritisation.

**What breaks it:** Making threads serial. Collapsing threads into sub-bullets of the main analysis. Removing the "Pull thread" action. Limiting the number of active threads.

---

## The User's Role — Confirm, Don't Just Receive

At every stage transition, the user sees the output and confirms before proceeding. The Ideal Scene is editable. The Data Scope is editable. This is not a UX nicety — it is analytically essential.

The user has context the AI doesn't. Their amendment of the Ideal Scene or Data Scope before proceeding changes the analysis that follows. Removing this human checkpoint turns Lensmen into an automated black box and removes the discipline that makes it powerful.

**What breaks it:** Auto-advancing through stages. Making Ideal Scene or Data Scope read-only before the user confirms. Hiding intermediate outputs.

---

## What Lensmen Is Not

- **Not a fact-checker.** It finds friction, not truth.
- **Not a verdict machine.** Every finding points outward to what needs investigating, never inward to a conclusion.
- **Not a summariser.** It does not condense claims — it stress-tests them.
- **Not a chatbot.** There is no conversational back-and-forth in the analysis flow. The flow is staged and disciplined.

---

## The API Architecture — Why It Is What It Is

Lensmen makes multiple sequential API calls, not one. Each stage is a separate call with a precisely crafted system prompt. This is deliberate:

- The Ideal Scene call uses a short, focused prompt with a low token ceiling. It should return one sentence.
- The Data Scope call has access to both the claim and the confirmed Ideal Scene.
- The Analysis call has access to all three: claim, Ideal Scene, and confirmed Data Scope. It requires a high token ceiling (8000) because it must produce findings across all 16 lenses.
- The Primary Nuttiness call receives only the non-clean findings — not the full analysis — to force focus on friction rather than comprehensiveness.
- Thread scope calls are lean and targeted, using only 4-6 items.

**What breaks it:** Combining stages into a single API call. Passing the full analysis to the Primary Nuttiness prompt. Reducing the Analysis token ceiling below what 16 lens findings require.

---

## The Lens Definitions Are the Product

The 16 lens definitions are not placeholder text. Each one asks a precise question that cannot be approximated by a simpler version. Do not:

- Rename lenses to sound friendlier
- Merge lenses that seem similar
- Rewrite lens definitions to be shorter or more generic
- Add lenses without understanding the Data Series framework

The lens definitions may be extended with additional lenses as the framework develops — but only by someone who understands the Data Series methodology deeply enough to know what a new lens must do differently from the existing 16.

---

## Deployment Considerations

**API key handling:** The current implementation runs inside Claude.ai, which handles authentication. In a standalone deployment, users must supply their own Anthropic API key. The recommended approach is a client-side input field where the key is held in memory only, never transmitted to any server other than Anthropic's. Do not log, store, or transmit user API keys.

**Model:** The tool is built for `claude-sonnet-4-20250514`. The Analysis prompt in particular pushes the model's reasoning capability. Do not substitute a lighter model without extensive testing — the quality of lens findings degrades significantly on smaller models.

**Cost:** A full 16-lens analysis involves 4+ API calls with substantial token usage, particularly the analysis call. Build cost transparency into any paywalled deployment.

---

## Summary: The Things That Must Not Break

1. The four-stage sequence must be preserved and visible to the user.
2. The user must be able to edit the Ideal Scene and Data Scope before confirming.
3. Lens findings must surface friction, never verdicts.
4. The Primary Nuttiness must be derived from non-clean findings only, framed as "causatively senior," and accompanied by a root cause hypothesis and next move.
5. Threads must be parallel and each must run the full pipeline.
6. The "Pull thread" action must be available on every finding and on the Primary Nuttiness.
7. The lens definitions must not be simplified, merged, or rewritten without deep knowledge of the methodology.

Break any of these and you have a different, lesser tool.

---

*Lensmen was developed by pazooter. MIT License. The methodology is based on the Data Series analytical framework.*
