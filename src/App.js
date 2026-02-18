import { useState, useCallback, useRef } from "react";

// ─── AUGMENT CODE BRAND SYSTEM ────────────────────────────────────────────────
const B = {
  black: "#0D0D0D", green: "#158158", greenLight: "#1AAA6E",
  greenBright: "#22C97A", greenDark: "#0D6B48", white: "#FFFFFF",
  offWhite: "#F5F5F5", cardBg: "#F8F8F8", gray: "#888888",
  darkGray: "#444444", greenBg: "#EBF5F0", red: "#D94F4F",
  redBg: "#FDF2F2", amber: "#D4A017", amberBg: "#FFFBEB",
};

// ─── PLAYS DATA ───────────────────────────────────────────────────────────────
const PLAYS = [
  {
    id: "code-review", label: "Code Review", number: "01",
    tagline: "Recover senior engineering time. Ship faster. Catch more bugs.",
    description: "Augment's Context Engine acts as a codebase-aware reviewer on every PR — cutting repetitive review work by 30–50%, flagging real bugs, and accelerating merge cycles across your entire org.",
    inputs: [
      { key: "devs", label: "Engineers participating in review", default: 50, min: 1, max: 5000, step: 1, unit: "" },
      { key: "hoursPerWeek", label: "Hours/week per engineer on review", default: 5, min: 0.5, max: 40, step: 0.5, unit: "hrs" },
      { key: "hourlyCost", label: "Fully loaded engineer cost", default: 120, min: 50, max: 400, step: 5, unit: "$/hr" },
      { key: "prsPerMonth", label: "PRs per month (org-wide)", default: 300, min: 10, max: 50000, step: 10, unit: "" },
      { key: "reworkRate", label: "% PRs requiring major rework cycles", default: 20, min: 0, max: 80, step: 1, unit: "%" },
      { key: "incidentValue", label: "Annual value of avoided incidents", default: 150000, min: 0, max: 5000000, step: 10000, unit: "$" },
      { key: "augmentCost", label: "Estimated annual Augment cost", default: 180000, min: 10000, max: 5000000, step: 5000, unit: "$" },
    ],
    savingsRange: [0.30, 0.40, 0.50], savingsLabel: "Review time recovered",
    compute: (v, pct) => {
      const base = v.devs * v.hoursPerWeek * 52 * v.hourlyCost;
      const timeSavings = base * pct;
      const reworkSavings = (v.prsPerMonth * 12) * (v.reworkRate / 100) * 0.25 * 2 * v.hourlyCost * 0.30;
      const totalBenefit = timeSavings + reworkSavings + v.incidentValue;
      const roi = ((totalBenefit - v.augmentCost) / v.augmentCost) * 100;
      const payback = v.augmentCost / (totalBenefit / 12);
      const hoursRecovered = v.devs * v.hoursPerWeek * 52 * pct;
      return { timeSavings, reworkSavings, totalBenefit, roi, payback, hoursRecovered, fteEquivalent: hoursRecovered / 2080 };
    },
    metrics: [
      { key: "timeSavings", label: "Review time savings", format: "dollar" },
      { key: "reworkSavings", label: "Rework cycle savings", format: "dollar" },
      { key: "hoursRecovered", label: "Eng hours recovered/yr", format: "hours" },
      { key: "fteEquivalent", label: "FTE capacity recovered", format: "fte" },
      { key: "totalBenefit", label: "Total annual benefit", format: "dollar", highlight: true },
      { key: "roi", label: "Return on investment", format: "percent", highlight: true },
    ],
    benchmarks: [
      { stat: "55–70%", label: "Comment address rate (industry-leading)" },
      { stat: "30–50%", label: "Reduction in senior review time" },
      { stat: "40%↓", label: "Faster time-to-first-review" },
      { stat: "~90%", label: "Bug detection rate" },
    ],
    additionalMetrics: [
      { label: "Change Failure Rate (CFR)", desc: "Track % of merged PRs causing incidents — AI review directly reduces escaped defects and rollbacks." },
      { label: "PR Comment Address Rate", desc: "55–70% of Augment comments actioned vs ~30% industry norm — signal quality is the differentiator." },
      { label: "Reviewer Utilization", desc: "Measure senior eng hours on high-value vs repetitive review; track the shift to strategic work post-adoption." },
      { label: "Time-to-First-Review (TFR)", desc: "Elite teams: <4 hrs. Augment acts instantly on every PR, eliminating the wait-for-reviewer bottleneck." },
    ],
  },
  {
    id: "unit-test", label: "Unit Test Automation", number: "02",
    tagline: "Give engineers back their week. Ship with confidence.",
    description: "Engineers spend ~10% of their week writing and maintaining unit tests. Augment generates codebase-aware tests, boosts coverage, and auto-fixes CI failures — removing grunt work without sacrificing quality.",
    inputs: [
      { key: "devs", label: "Engineers writing/maintaining unit tests", default: 80, min: 1, max: 5000, step: 1, unit: "" },
      { key: "testTimePct", label: "% of week spent on unit tests", default: 10, min: 1, max: 30, step: 1, unit: "%" },
      { key: "hourlyCost", label: "Fully loaded engineer cost", default: 120, min: 50, max: 400, step: 5, unit: "$/hr" },
      { key: "currentCoverage", label: "Current avg unit test coverage", default: 60, min: 0, max: 100, step: 1, unit: "%" },
      { key: "ciFailuresPerWeek", label: "Test-related CI failures per week", default: 30, min: 0, max: 500, step: 1, unit: "" },
      { key: "incidentValue", label: "Annual value of avoided defects", default: 150000, min: 0, max: 5000000, step: 10000, unit: "$" },
      { key: "augmentCost", label: "Estimated annual Augment cost", default: 250000, min: 10000, max: 5000000, step: 5000, unit: "$" },
    ],
    savingsRange: [0.30, 0.50, 0.70], savingsLabel: "Test time automated",
    compute: (v, pct) => {
      const weeklyTestHours = v.devs * 40 * (v.testTimePct / 100);
      const timeSavings = weeklyTestHours * 52 * v.hourlyCost * pct;
      const ciSavings = v.ciFailuresPerWeek * 52 * 1.5 * v.hourlyCost * 0.4;
      const totalBenefit = timeSavings + ciSavings + v.incidentValue;
      const roi = ((totalBenefit - v.augmentCost) / v.augmentCost) * 100;
      const payback = v.augmentCost / (totalBenefit / 12);
      const hoursRecovered = weeklyTestHours * 52 * pct;
      return { timeSavings, ciSavings, totalBenefit, roi, payback, hoursRecovered, fteEquivalent: hoursRecovered / 2080 };
    },
    metrics: [
      { key: "timeSavings", label: "Test authoring savings", format: "dollar" },
      { key: "ciSavings", label: "CI triage savings", format: "dollar" },
      { key: "hoursRecovered", label: "Eng hours recovered/yr", format: "hours" },
      { key: "fteEquivalent", label: "FTE capacity recovered", format: "fte" },
      { key: "totalBenefit", label: "Total annual benefit", format: "dollar", highlight: true },
      { key: "roi", label: "Return on investment", format: "percent", highlight: true },
    ],
    benchmarks: [
      { stat: "~10%", label: "Of dev week spent on unit tests" },
      { stat: "30–50%", label: "Reduction in test-related CI failures" },
      { stat: "≥80%", label: "Generated test correctness target" },
      { stat: "3–5×", label: "ROI with time + defect avoidance" },
    ],
    additionalMetrics: [
      { label: "Unit Test Coverage %", desc: "Track per-service coverage deltas. Target: ≥80% on critical paths. Pilot goal: +10–20 coverage points." },
      { label: "Test Acceptance Rate", desc: "% of Augment-generated tests merged with minimal edits. Target: ≥70% to establish dev trust." },
      { label: "Defect Escape Rate", desc: "Production bugs attributable to test gaps. Each defect costs 10–100× more than one caught in development." },
      { label: "Time-to-Green (TTG)", desc: "Time from failing test in CI to green build. Augment auto-fix targets 30–50% TTG reduction per pipeline." },
    ],
  },
  {
    id: "build-failure", label: "Build Failure Analyzer", number: "03",
    tagline: "From red to green in minutes, not hours.",
    description: "Augment correlates code changes, tests, logs, and ownership into a coherent triage story — diagnosing failures, routing to the right engineer, and proposing fixes before the team opens Slack.",
    inputs: [
      { key: "failuresPerWeek", label: "Build failures per week", default: 50, min: 1, max: 5000, step: 1, unit: "" },
      { key: "mttrHours", label: "Current MTTR per failure (hours)", default: 3, min: 0.25, max: 24, step: 0.25, unit: "hrs" },
      { key: "peoplePerFailure", label: "Avg engineers pulled in per failure", default: 2, min: 1, max: 20, step: 0.5, unit: "" },
      { key: "hourlyCost", label: "Blended hourly cost (dev + SRE)", default: 130, min: 50, max: 400, step: 5, unit: "$/hr" },
      { key: "trunkLockHours", label: "Avg trunk lock duration per week (hrs)", default: 4, min: 0, max: 40, step: 0.5, unit: "hrs" },
      { key: "devsBlocked", label: "Devs blocked during trunk lock", default: 50, min: 1, max: 2000, step: 1, unit: "" },
      { key: "releaseDelayValue", label: "Annual value of avoided release delays", default: 200000, min: 0, max: 5000000, step: 10000, unit: "$" },
      { key: "augmentCost", label: "Estimated annual Augment cost", default: 200000, min: 10000, max: 5000000, step: 5000, unit: "$" },
    ],
    savingsRange: [0.50, 0.70, 0.80], savingsLabel: "MTTR reduction",
    compute: (v, pct) => {
      const annualTriage = v.failuresPerWeek * 52 * v.mttrHours * v.peoplePerFailure * v.hourlyCost;
      const timeSavings = annualTriage * pct;
      const trunkLockSavings = v.trunkLockHours * 52 * v.devsBlocked * v.hourlyCost * 0.5 * 0.6;
      const totalBenefit = timeSavings + trunkLockSavings + v.releaseDelayValue;
      const roi = ((totalBenefit - v.augmentCost) / v.augmentCost) * 100;
      const payback = v.augmentCost / (totalBenefit / 12);
      const hoursRecovered = v.failuresPerWeek * 52 * v.mttrHours * v.peoplePerFailure * pct;
      const newMttr = v.mttrHours * (1 - pct);
      return { timeSavings, trunkLockSavings, totalBenefit, roi, payback, hoursRecovered, fteEquivalent: hoursRecovered / 2080, newMttr };
    },
    metrics: [
      { key: "timeSavings", label: "Triage time savings", format: "dollar" },
      { key: "trunkLockSavings", label: "Trunk lock savings", format: "dollar" },
      { key: "hoursRecovered", label: "Eng hours recovered/yr", format: "hours" },
      { key: "newMttr", label: "New MTTR (post-Augment)", format: "hours_val" },
      { key: "totalBenefit", label: "Total annual benefit", format: "dollar", highlight: true },
      { key: "roi", label: "Return on investment", format: "percent", highlight: true },
    ],
    benchmarks: [
      { stat: "60–80%", label: "MTTR reduction — hours to minutes" },
      { stat: "65%", label: "Reduction in CI firefighting" },
      { stat: "~10×", label: "ROI on platform automation" },
      { stat: "2.5%", label: "Dev time lost to flaky tests (recoverable)" },
    ],
    additionalMetrics: [
      { label: "Build Failure Rate (BFR)", desc: "% of builds failing per pipeline. Elite: <5%. Most orgs: 15–30%. Augment diagnosis reduces recurrence." },
      { label: "MTTR (Mean Time to Remediate)", desc: "Target: <30 min. Augment auto-triage compresses hours → minutes on common failures." },
      { label: "Trunk Lock Frequency & Duration", desc: "Each event multiplies blocked devs × hourly cost — often thousands of dollars per hour." },
      { label: "Flaky Test Rate", desc: "% of failures from non-deterministic tests. At scale, flaky tests consumed 2.5% of total dev time over 5 years." },
    ],
  },
  {
    id: "interactive", label: "Interactive (IDE + CLI)", number: "04",
    tagline: "Every developer. Every day. Measurable productivity at scale.",
    description: "Augment's IDE and interactive CLI give every engineer a context-aware coding partner — saving hours on boilerplate, onboarding, and code navigation while consolidating your existing tool sprawl into one unified platform.",
    inputs: [
      { key: "devs", label: "Active interactive users (IDE/CLI)", default: 100, min: 1, max: 10000, step: 1, unit: "" },
      { key: "hrsSavedPerWeek", label: "Hours saved per dev per week", default: 3, min: 0.5, max: 15, step: 0.5, unit: "hrs" },
      { key: "hourlyCost", label: "Fully loaded engineer cost", default: 120, min: 50, max: 400, step: 5, unit: "$/hr" },
      { key: "onboardingWeeksSaved", label: "Onboarding weeks saved per new hire", default: 2, min: 0, max: 12, step: 0.5, unit: "wks" },
      { key: "newDevsPerYear", label: "New hires / major transfers per year", default: 20, min: 0, max: 500, step: 1, unit: "" },
      { key: "retiredToolSpend", label: "Annual retired tool spend (Copilot, etc.)", default: 60000, min: 0, max: 2000000, step: 5000, unit: "$" },
      { key: "augmentCost", label: "Estimated annual Augment cost", default: 240000, min: 10000, max: 5000000, step: 5000, unit: "$" },
    ],
    savingsRange: [0.60, 0.80, 1.00], savingsLabel: "Productivity uplift captured",
    compute: (v, pct) => {
      const annualHoursSaved = v.devs * v.hrsSavedPerWeek * 52;
      const productivityValue = annualHoursSaved * pct * v.hourlyCost;
      const onboardingHoursSaved = v.onboardingWeeksSaved * 40 * v.newDevsPerYear;
      const onboardingValue = onboardingHoursSaved * v.hourlyCost;
      const toolConsolidationValue = v.retiredToolSpend;
      const totalBenefit = productivityValue + onboardingValue + toolConsolidationValue;
      const roi = ((totalBenefit - v.augmentCost) / v.augmentCost) * 100;
      const payback = v.augmentCost / (totalBenefit / 12);
      const hoursRecovered = annualHoursSaved * pct;
      const fteEquivalent = hoursRecovered / 2080;
      return { productivityValue, onboardingValue, toolConsolidationValue, totalBenefit, roi, payback, hoursRecovered, fteEquivalent };
    },
    metrics: [
      { key: "productivityValue", label: "Productivity value", format: "dollar" },
      { key: "onboardingValue", label: "Onboarding savings", format: "dollar" },
      { key: "toolConsolidationValue", label: "Tool consolidation savings", format: "dollar" },
      { key: "fteEquivalent", label: "FTE capacity recovered", format: "fte" },
      { key: "totalBenefit", label: "Total annual benefit", format: "dollar", highlight: true },
      { key: "roi", label: "Return on investment", format: "percent", highlight: true },
    ],
    benchmarks: [
      { stat: "1–5+ hrs", label: "Saved per dev per week in pilot surveys" },
      { stat: "60K+", label: "Annual hours saved at 100-dev scale" },
      { stat: "~10×", label: "Platform-level ROI in internal decks" },
      { stat: "$3M+", label: "Productivity value at scale (100 devs)" },
    ],
    additionalMetrics: [
      { label: "Active Adoption Rate", desc: "% of licensed devs using IDE/CLI weekly. Target: ≥70% MAU. Below 50% signals enablement gaps, not product gaps." },
      { label: "Boilerplate & Search Time", desc: "Hours saved on 'where is X used?' searches, log spelunking, and scaffold generation — survey before and after." },
      { label: "Cross-Team Ramp Time", desc: "Track weeks to first meaningful contribution for new hires / transfers. Augment context acceleration compresses this materially." },
      { label: "Tool Consolidation Audit", desc: "Document every copilot/IDE AI tool currently licensed. Each retired = hard cost savings + reduced security surface area." },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (val, format) => {
  if (val === undefined || val === null || isNaN(val)) return "—";
  if (format === "dollar") return "$" + Math.round(val).toLocaleString();
  if (format === "percent") return Math.round(val) + "%";
  if (format === "hours") return Math.round(val).toLocaleString() + " hrs";
  if (format === "hours_val") return val < 1 ? Math.round(val * 60) + " min" : val.toFixed(1) + " hrs";
  if (format === "months") return val < 1 ? "< 1 mo" : val.toFixed(1) + " mo";
  if (format === "fte") return val.toFixed(1) + " FTEs";
  return String(val);
};

const SCENARIO_LABELS = ["Conservative", "Midpoint", "Optimistic"];

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const card = (extra = {}) => ({
  background: B.white, border: "1px solid #E8E8E8",
  borderTop: `3px solid ${B.green}`, borderRadius: 4,
  padding: "20px 22px", ...extra,
});

const sectionLabel = { fontSize: 9, color: B.green, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 };
const darkCard = (extra = {}) => ({ background: B.black, borderRadius: 4, padding: "16px 18px", ...extra });

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
function SliderInput({ input, value, onChange }) {
  const pct = ((value - input.min) / (input.max - input.min)) * 100;
  const dv =
    input.unit === "$" ? "$" + value.toLocaleString() :
    input.unit === "%" ? value + "%" :
    input.unit === "$/hr" ? "$" + value + "/hr" :
    input.unit === "hrs" ? value + " hrs" :
    input.unit === "wks" ? value + " wks" :
    value.toLocaleString();
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={{ fontSize: 10, color: B.gray, fontFamily: "inherit", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500 }}>{input.label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color: B.green }}>{dv}</span>
      </div>
      <div style={{ position: "relative", height: 4 }}>
        <div style={{ position: "absolute", inset: 0, background: B.offWhite, borderRadius: 2 }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: pct + "%", background: B.green, borderRadius: 2, transition: "width 0.08s" }} />
        <input type="range" min={input.min} max={input.max} step={input.step} value={value}
          onChange={e => onChange(input.key, parseFloat(e.target.value))}
          style={{ position: "absolute", top: -8, left: 0, width: "100%", height: 20, WebkitAppearance: "none", appearance: "none", background: "transparent", outline: "none", cursor: "pointer", margin: 0 }} />
      </div>
    </div>
  );
}

function MetricCard({ metric, value }) {
  const formatted = fmt(value, metric.format);
  if (metric.highlight) {
    const neg = metric.format === "percent" && value < 0;
    return (
      <div style={{ background: neg ? B.redBg : B.greenBg, border: `2px solid ${neg ? B.red : B.green}`, borderRadius: 4, padding: "16px 18px" }}>
        <div style={{ ...sectionLabel, marginBottom: 6 }}>{metric.label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: neg ? B.red : B.greenDark, lineHeight: 1 }}>{formatted}</div>
      </div>
    );
  }
  return (
    <div style={{ background: B.cardBg, border: "1px solid #E8E8E8", borderLeft: `3px solid ${B.green}`, borderRadius: 4, padding: "14px 16px" }}>
      <div style={{ fontSize: 9, color: B.gray, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 5 }}>{metric.label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: B.black, lineHeight: 1 }}>{formatted}</div>
    </div>
  );
}

// ─── PLAY TAB CONTENT ─────────────────────────────────────────────────────────
function PlayTab({ play, vals, onChange, scenarioIdx, setScenarioIdx }) {
  const [showAdditional, setShowAdditional] = useState(false);
  const pct = play.savingsRange[scenarioIdx];
  const results = play.compute(vals, pct);
  const roiMultiple = (results.totalBenefit / vals.augmentCost).toFixed(1);

  return (
    <div>
      {/* Play header */}
      <div style={{ background: B.black, padding: "24px 32px 22px", borderBottom: `4px solid ${B.green}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: B.greenBright, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>AUTOMATION PLAY {play.number}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: B.white, marginBottom: 6, lineHeight: 1.2 }}>{play.label}</h2>
            <p style={{ fontSize: 12, color: B.greenLight, fontWeight: 500, marginBottom: 8 }}>{play.tagline}</p>
            <p style={{ fontSize: 11, color: B.gray, lineHeight: 1.7, maxWidth: 620 }}>{play.description}</p>
          </div>
          <div style={{ background: B.green, borderRadius: 4, padding: "14px 24px", textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>ROI Multiple</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: B.white, lineHeight: 1 }}>{roiMultiple}×</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{SCENARIO_LABELS[scenarioIdx]}</div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card()}>
            <div style={sectionLabel}>Input Your Numbers</div>
            {play.inputs.map(inp => <SliderInput key={inp.key} input={inp} value={vals[inp.key]} onChange={onChange} />)}
          </div>
          <div style={{ background: B.white, border: "1px solid #E8E8E8", borderRadius: 4, padding: "16px 18px" }}>
            <div style={sectionLabel}>{play.savingsLabel} — Choose Scenario</div>
            <div style={{ display: "flex", gap: 8 }}>
              {SCENARIO_LABELS.map((label, i) => (
                <button key={label} onClick={() => setScenarioIdx(i)} style={{
                  flex: 1, padding: "10px 6px", borderRadius: 4,
                  border: `1px solid ${scenarioIdx === i ? B.green : "#E0E0E0"}`,
                  background: scenarioIdx === i ? B.greenBg : B.white,
                  color: scenarioIdx === i ? B.greenDark : B.gray,
                  fontWeight: 700, fontSize: 9, cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}>
                  <div style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 15, color: scenarioIdx === i ? B.green : B.darkGray }}>{Math.round(play.savingsRange[i] * 100)}%</div>
                </button>
              ))}
            </div>
          </div>
          <div style={darkCard()}>
            <div style={{ ...sectionLabel, color: B.greenBright, marginBottom: 12 }}>Validated Pilot Outcomes</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {play.benchmarks.map((b, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderLeft: `2px solid ${B.green}`, borderRadius: 2, padding: "10px 12px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: B.greenBright, marginBottom: 2 }}>{b.stat}</div>
                  <div style={{ fontSize: 10, color: B.gray, lineHeight: 1.4 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card()}>
            <div style={sectionLabel}>Impact Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {play.metrics.map(m => <MetricCard key={m.key} metric={m} value={results[m.key]} />)}
            </div>
          </div>
          <div style={{ background: B.white, border: "1px solid #E8E8E8", borderRadius: 4, padding: "18px 20px" }}>
            <div style={sectionLabel}>Benefit vs. Investment</div>
            {[
              { label: "Total Annual Benefit", value: results.totalBenefit, color: B.green },
              { label: "Annual Augment Cost", value: vals.augmentCost, color: B.gray },
            ].map(bar => (
              <div key={bar.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 9, color: B.darkGray, textTransform: "uppercase", letterSpacing: "0.04em" }}>{bar.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: B.black }}>${Math.round(bar.value).toLocaleString()}</span>
                </div>
                <div style={{ height: 5, background: B.offWhite, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (bar.value / Math.max(results.totalBenefit, vals.augmentCost)) * 100)}%`, background: bar.color, borderRadius: 2, transition: "width 0.35s ease" }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 6, padding: "10px 14px", background: results.totalBenefit > vals.augmentCost ? B.greenBg : B.redBg, border: `1px solid ${results.totalBenefit > vals.augmentCost ? B.green : B.red}`, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: B.darkGray, textTransform: "uppercase", letterSpacing: "0.06em" }}>Net Annual Benefit</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: results.totalBenefit > vals.augmentCost ? B.greenDark : B.red }}>${Math.round(results.totalBenefit - vals.augmentCost).toLocaleString()}</span>
            </div>
          </div>
          <div style={darkCard()}>
            <div style={{ ...sectionLabel, color: B.greenBright, marginBottom: 10 }}>Executive Summary</div>
            <p style={{ fontSize: 11, color: "#CCCCCC", lineHeight: 1.9 }}>
              At the <span style={{ color: B.greenBright, fontWeight: 700 }}>{SCENARIO_LABELS[scenarioIdx].toLowerCase()}</span> scenario ({Math.round(pct * 100)}% {play.savingsLabel.toLowerCase()}), Augment delivers <span style={{ color: B.white, fontWeight: 700 }}>${Math.round(results.totalBenefit).toLocaleString()}</span> in annual benefit against a <span style={{ color: B.white, fontWeight: 700 }}>${vals.augmentCost.toLocaleString()}</span> investment — a <span style={{ color: B.greenBright, fontWeight: 700 }}>{Math.round(results.roi)}% ROI</span> with payback in <span style={{ color: B.greenBright, fontWeight: 700 }}>{results.payback.toFixed(1)} months</span>. Equivalent to recovering <span style={{ color: B.white, fontWeight: 700 }}>{results.fteEquivalent.toFixed(1)} FTEs</span> of engineering capacity per year.
            </p>
          </div>
        </div>
      </div>

      {/* Additional metrics */}
      <div style={{ padding: "0 32px 32px" }}>
        <button onClick={() => setShowAdditional(!showAdditional)} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${B.green}`, borderRadius: 4, padding: "9px 16px", cursor: "pointer", color: B.green, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: showAdditional ? 14 : 0, transition: "all 0.15s" }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>{showAdditional ? "−" : "+"}</span>
          Additional Metrics to Drive Customer Value
        </button>
        {showAdditional && (
          <div style={card({ borderTop: `3px solid ${B.green}` })}>
            <div style={sectionLabel}>{play.label} — Additional Value Metrics</div>
            <p style={{ fontSize: 11, color: B.gray, marginBottom: 16, lineHeight: 1.6 }}>Use in discovery, pilot design, and exec readouts to quantify value beyond the primary model.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {play.additionalMetrics.map((m, i) => (
                <div key={i} style={{ background: B.cardBg, border: "1px solid #E8E8E8", borderLeft: `3px solid ${B.greenLight}`, borderRadius: 4, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.black, marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: B.gray, lineHeight: 1.6 }}>{m.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 18px", background: B.greenBg, borderRadius: 4, border: `1px solid ${B.green}33` }}>
              <div style={{ ...sectionLabel, marginBottom: 10 }}>Universal Metrics — All Plays</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "DORA Metrics", desc: "Deployment frequency, lead time, CFR, and MTTR all improve directly from Augment automation." },
                  { label: "Developer NPS", desc: "Track eng satisfaction before/after pilot. Eliminating grunt work is a talent retention argument." },
                  { label: "FTE Capacity Recovery", desc: "2.0 FTE recovery at $200K loaded cost = $400K in avoided hiring or reallocation." },
                ].map((m, i) => (
                  <div key={i} style={{ background: B.white, borderRadius: 4, padding: "12px 14px", border: "1px solid #E8E8E8" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: B.black, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: B.gray, lineHeight: 1.5 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUMMARY TAB ─────────────────────────────────────────────────────────────
function SummaryTab({ allResults, scenarios, customerName }) {
  const grandTotal = allResults.reduce((sum, r) => sum + r.results.totalBenefit, 0);
  const grandCost = allResults.reduce((sum, r) => sum + r.augmentCost, 0);
  const grandNet = grandTotal - grandCost;
  const grandROI = ((grandTotal - grandCost) / grandCost) * 100;
  const grandPayback = grandCost / (grandTotal / 12);
  const grandFTE = allResults.reduce((sum, r) => sum + (r.results.fteEquivalent || 0), 0);
  const grandHours = allResults.reduce((sum, r) => sum + (r.results.hoursRecovered || 0), 0);

  return (
    <div>
      {/* Summary header */}
      <div style={{ background: B.black, padding: "24px 32px 22px", borderBottom: `4px solid ${B.green}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: B.greenBright, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>COMBINED ROI SUMMARY</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: B.white, marginBottom: 6 }}>
              {customerName ? customerName + " × Augment Code" : "Full Platform ROI Summary"}
            </h2>
            <p style={{ fontSize: 11, color: B.gray, lineHeight: 1.7, maxWidth: 620 }}>Consolidated view across all four automation plays. Each play contributes independently — combined platform ROI reflects total engineering transformation potential.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Total Annual Benefit", value: "$" + Math.round(grandTotal).toLocaleString() },
              { label: "Combined ROI", value: Math.round(grandROI) + "%" },
              { label: "Payback Period", value: grandPayback.toFixed(1) + " mo" },
            ].map(stat => (
              <div key={stat.label} style={{ background: B.green, borderRadius: 4, padding: "12px 18px", textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{stat.label}</div>
                <div style={{ fontSize: stat.value.length > 8 ? 18 : 22, fontWeight: 700, color: B.white, lineHeight: 1 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Per-play breakdown table */}
        <div style={card({ marginBottom: 20 })}>
          <div style={sectionLabel}>Per-Play Breakdown</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${B.green}` }}>
                {["Play", "Scenario", "Total Benefit", "Augment Cost", "Net Benefit", "ROI", "FTEs Recovered", "Payback"].map(h => (
                  <th key={h} style={{ fontSize: 9, color: B.green, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, padding: "0 10px 10px 0", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResults.map((r, i) => (
                <tr key={r.play.id} style={{ borderBottom: "1px solid #F0F0F0", background: i % 2 === 0 ? B.white : B.cardBg }}>
                  <td style={{ padding: "12px 10px 12px 0", fontWeight: 700, fontSize: 12, color: B.black }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 2, background: B.green, fontSize: 8, fontWeight: 700, color: B.white, flexShrink: 0 }}>{r.play.number}</span>
                      {r.play.label}
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px 12px 0", fontSize: 10, color: B.gray }}>{SCENARIO_LABELS[r.scenarioIdx]}</td>
                  <td style={{ padding: "12px 10px 12px 0", fontSize: 12, fontWeight: 700, color: B.greenDark }}>${Math.round(r.results.totalBenefit).toLocaleString()}</td>
                  <td style={{ padding: "12px 10px 12px 0", fontSize: 12, color: B.darkGray }}>${Math.round(r.augmentCost).toLocaleString()}</td>
                  <td style={{ padding: "12px 10px 12px 0", fontSize: 12, fontWeight: 700, color: r.results.totalBenefit > r.augmentCost ? B.greenDark : B.red }}>
                    ${Math.round(r.results.totalBenefit - r.augmentCost).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 10px 12px 0" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: B.green, background: B.greenBg, padding: "2px 8px", borderRadius: 3 }}>{Math.round(r.results.roi)}%</span>
                  </td>
                  <td style={{ padding: "12px 10px 12px 0", fontSize: 12, color: B.darkGray }}>{(r.results.fteEquivalent || 0).toFixed(1)}</td>
                  <td style={{ padding: "12px 10px 12px 0", fontSize: 12, color: B.darkGray }}>{r.results.payback.toFixed(1)} mo</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${B.green}`, background: B.greenBg }}>
                <td colSpan={2} style={{ padding: "12px 10px 12px 0", fontSize: 12, fontWeight: 700, color: B.greenDark }}>TOTAL (All Plays)</td>
                <td style={{ padding: "12px 10px 12px 0", fontSize: 14, fontWeight: 700, color: B.greenDark }}>${Math.round(grandTotal).toLocaleString()}</td>
                <td style={{ padding: "12px 10px 12px 0", fontSize: 12, color: B.darkGray }}>${Math.round(grandCost).toLocaleString()}</td>
                <td style={{ padding: "12px 10px 12px 0", fontSize: 14, fontWeight: 700, color: B.greenDark }}>${Math.round(grandNet).toLocaleString()}</td>
                <td style={{ padding: "12px 10px 12px 0" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: B.white, background: B.green, padding: "3px 10px", borderRadius: 3 }}>{Math.round(grandROI)}%</span>
                </td>
                <td style={{ padding: "12px 10px 12px 0", fontSize: 12, fontWeight: 700, color: B.greenDark }}>{grandFTE.toFixed(1)}</td>
                <td style={{ padding: "12px 10px 12px 0", fontSize: 12, fontWeight: 700, color: B.greenDark }}>{grandPayback.toFixed(1)} mo</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Benefit distribution visual */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={card()}>
            <div style={sectionLabel}>Benefit Distribution by Play</div>
            {allResults.map(r => {
              const sharePct = grandTotal > 0 ? (r.results.totalBenefit / grandTotal) * 100 : 0;
              return (
                <div key={r.play.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: B.darkGray, fontWeight: 600 }}>{r.play.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: B.black }}>${Math.round(r.results.totalBenefit).toLocaleString()} <span style={{ color: B.gray, fontWeight: 400, fontSize: 9 }}>({sharePct.toFixed(0)}%)</span></span>
                  </div>
                  <div style={{ height: 6, background: B.offWhite, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: sharePct + "%", background: B.green, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Total Annual Benefit", value: "$" + Math.round(grandTotal).toLocaleString(), sub: "across all plays" },
              { label: "Total Engineering Hours Recovered", value: Math.round(grandHours).toLocaleString() + " hrs", sub: "per year" },
              { label: "FTE Capacity Recovered", value: grandFTE.toFixed(1) + " FTEs", sub: "equivalent headcount" },
              { label: "Net Annual Return", value: "$" + Math.round(grandNet).toLocaleString(), sub: "benefit minus Augment cost" },
            ].map(stat => (
              <div key={stat.label} style={{ background: B.cardBg, border: "1px solid #E8E8E8", borderLeft: `3px solid ${B.green}`, borderRadius: 4, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: B.gray, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>{stat.label}</div>
                  <div style={{ fontSize: 9, color: B.gray, marginTop: 1 }}>{stat.sub}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: B.greenDark }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exec narrative */}
        <div style={darkCard()}>
          <div style={{ ...sectionLabel, color: B.greenBright, marginBottom: 10 }}>Combined Executive Narrative</div>
          <p style={{ fontSize: 11, color: "#CCCCCC", lineHeight: 1.9, maxWidth: 800 }}>
            Across all four Augment Code automation plays — Code Review, Unit Test Automation, Build Failure Analyzer, and Interactive (IDE + CLI) — the platform delivers a combined <span style={{ color: B.white, fontWeight: 700 }}>${Math.round(grandTotal).toLocaleString()}</span> in annual benefit against a <span style={{ color: B.white, fontWeight: 700 }}>${Math.round(grandCost).toLocaleString()}</span> platform investment. That is a <span style={{ color: B.greenBright, fontWeight: 700 }}>{Math.round(grandROI)}% combined ROI</span> with a payback period of <span style={{ color: B.greenBright, fontWeight: 700 }}>{grandPayback.toFixed(1)} months</span> — recovering the equivalent of <span style={{ color: B.white, fontWeight: 700 }}>{grandFTE.toFixed(1)} FTEs</span> of engineering capacity annually. These projections are based on {SCENARIO_LABELS[allResults[0]?.scenarioIdx || 1].toLowerCase()} assumptions validated through Augment pilot programs and are refined during the evaluation phase with your actual production metrics.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
function exportToPDF(allResults, customerName, scenarios) {
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow popups to export PDF."); return; }

  const grandTotal = allResults.reduce((s, r) => s + r.results.totalBenefit, 0);
  const grandCost = allResults.reduce((s, r) => s + r.augmentCost, 0);
  const grandNet = grandTotal - grandCost;
  const grandROI = ((grandTotal - grandCost) / grandCost) * 100;
  const grandPayback = grandCost / (grandTotal / 12);
  const grandFTE = allResults.reduce((s, r) => s + (r.results.fteEquivalent || 0), 0);

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const playPage = (r) => {
    const pct = r.play.savingsRange[r.scenarioIdx];
    const scenario = SCENARIO_LABELS[r.scenarioIdx];
    const res = r.results;
    return `
    <div class="page">
      <div class="page-header">
        <div class="page-header-left">
          <div class="eyebrow">AUTOMATION PLAY ${r.play.number}</div>
          <div class="page-title">${r.play.label}</div>
          <div class="page-tagline">${r.play.tagline}</div>
        </div>
        <div class="roi-badge">${(res.totalBenefit / r.augmentCost).toFixed(1)}×<div class="roi-label">ROI Multiple · ${scenario}</div></div>
      </div>
      <div class="two-col">
        <div class="col">
          <div class="section-label">Impact Summary</div>
          <div class="metric-grid">
            ${r.play.metrics.map(m => {
              const v = res[m.key];
              const f = fmt(v, m.format);
              return m.highlight
                ? `<div class="metric-card metric-highlight"><div class="metric-label">${m.label}</div><div class="metric-value-lg">${f}</div></div>`
                : `<div class="metric-card"><div class="metric-label">${m.label}</div><div class="metric-value">${f}</div></div>`;
            }).join("")}
          </div>
          <div class="section-label" style="margin-top:16px">Benefit vs. Investment</div>
          <div class="bar-row"><span class="bar-label">Total Annual Benefit</span><span class="bar-amount">$${Math.round(res.totalBenefit).toLocaleString()}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:100%"></div></div>
          <div class="bar-row" style="margin-top:8px"><span class="bar-label">Augment Cost</span><span class="bar-amount">$${Math.round(r.augmentCost).toLocaleString()}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round((r.augmentCost / res.totalBenefit) * 100)}%;background:#888"></div></div>
          <div class="net-row">
            <span>Net Annual Benefit</span>
            <span>$${Math.round(res.totalBenefit - r.augmentCost).toLocaleString()}</span>
          </div>
        </div>
        <div class="col">
          <div class="section-label">Validated Pilot Outcomes</div>
          <div class="benchmarks">
            ${r.play.benchmarks.map(b => `<div class="benchmark-card"><div class="bench-stat">${b.stat}</div><div class="bench-label">${b.label}</div></div>`).join("")}
          </div>
          <div class="exec-box" style="margin-top:16px">
            <div class="section-label" style="color:#22C97A">Executive Summary</div>
            <p class="exec-text">At the <strong>${scenario.toLowerCase()}</strong> scenario (${Math.round(pct * 100)}% ${r.play.savingsLabel.toLowerCase()}), Augment delivers <strong>$${Math.round(res.totalBenefit).toLocaleString()}</strong> in annual benefit against a <strong>$${Math.round(r.augmentCost).toLocaleString()}</strong> investment — a <strong>${Math.round(res.roi)}% ROI</strong> with payback in <strong>${res.payback.toFixed(1)} months</strong>. Equivalent to recovering <strong>${(res.fteEquivalent || 0).toFixed(1)} FTEs</strong> of engineering capacity per year.</p>
          </div>
        </div>
      </div>
      <div class="page-footer">PRIVILEGED &amp; CONFIDENTIAL · augment code · ${today}</div>
    </div>`;
  };

  const summaryPage = `
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="eyebrow">COMBINED ROI SUMMARY</div>
        <div class="page-title">${customerName ? customerName + " × Augment Code" : "Full Platform Summary"}</div>
        <div class="page-tagline">Consolidated view across all four automation plays</div>
      </div>
      <div style="display:flex;gap:8px">
        ${[
          { l: "Total Benefit", v: "$" + Math.round(grandTotal).toLocaleString() },
          { l: "Combined ROI", v: Math.round(grandROI) + "%" },
          { l: "Payback", v: grandPayback.toFixed(1) + " mo" },
        ].map(s => `<div class="roi-badge" style="font-size:18px;min-width:90px">${s.v}<div class="roi-label">${s.l}</div></div>`).join("")}
      </div>
    </div>
    <div class="section-label">Per-Play Breakdown</div>
    <table class="summary-table">
      <thead><tr>${["Play","Scenario","Total Benefit","Augment Cost","Net Benefit","ROI","FTEs","Payback"].map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${allResults.map((r,i) => `
          <tr style="background:${i%2===0?"#fff":"#F8F8F8"}">
            <td><strong>${r.play.label}</strong></td>
            <td>${SCENARIO_LABELS[r.scenarioIdx]}</td>
            <td style="color:#0D6B48;font-weight:700">$${Math.round(r.results.totalBenefit).toLocaleString()}</td>
            <td>$${Math.round(r.augmentCost).toLocaleString()}</td>
            <td style="color:#0D6B48;font-weight:700">$${Math.round(r.results.totalBenefit - r.augmentCost).toLocaleString()}</td>
            <td><span style="background:#EBF5F0;color:#158158;font-weight:700;padding:2px 6px;border-radius:3px">${Math.round(r.results.roi)}%</span></td>
            <td>${(r.results.fteEquivalent||0).toFixed(1)}</td>
            <td>${r.results.payback.toFixed(1)} mo</td>
          </tr>`).join("")}
        <tr style="background:#EBF5F0;font-weight:700;border-top:2px solid #158158">
          <td colspan="2">TOTAL</td>
          <td style="color:#0D6B48">$${Math.round(grandTotal).toLocaleString()}</td>
          <td>$${Math.round(grandCost).toLocaleString()}</td>
          <td style="color:#0D6B48">$${Math.round(grandNet).toLocaleString()}</td>
          <td><span style="background:#158158;color:#fff;font-weight:700;padding:2px 8px;border-radius:3px">${Math.round(grandROI)}%</span></td>
          <td>${grandFTE.toFixed(1)}</td>
          <td>${grandPayback.toFixed(1)} mo</td>
        </tr>
      </tbody>
    </table>
    <div class="exec-box" style="margin-top:20px">
      <div class="section-label" style="color:#22C97A">Combined Executive Narrative</div>
      <p class="exec-text">Across all four Augment Code automation plays, the platform delivers a combined <strong>$${Math.round(grandTotal).toLocaleString()}</strong> in annual benefit against a <strong>$${Math.round(grandCost).toLocaleString()}</strong> platform investment — a <strong>${Math.round(grandROI)}% combined ROI</strong> with a payback period of <strong>${grandPayback.toFixed(1)} months</strong>, recovering the equivalent of <strong>${grandFTE.toFixed(1)} FTEs</strong> of engineering capacity annually.</p>
    </div>
    <div class="page-footer">PRIVILEGED &amp; CONFIDENTIAL · augment code · ${today}</div>
  </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Augment Code ROI — ${customerName || "Customer"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto Mono', monospace; background: #fff; color: #0D0D0D; font-size: 11px; }
    .page { width: 100%; min-height: 100vh; padding: 36px 40px 24px; page-break-after: always; position: relative; display: flex; flex-direction: column; gap: 20px; }
    .title-page { background: #0D0D0D; color: #fff; display: flex; flex-direction: column; justify-content: space-between; min-height: 100vh; padding: 60px 60px 40px; page-break-after: always; }
    .page-header { background: #0D0D0D; color: #fff; padding: 20px 24px 18px; border-bottom: 4px solid #158158; border-radius: 4px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .page-header-left { flex: 1; }
    .eyebrow { font-size: 8px; color: #22C97A; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; margin-bottom: 5px; }
    .page-title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .page-tagline { font-size: 11px; color: #1AAA6E; font-weight: 500; }
    .roi-badge { background: #158158; border-radius: 4px; padding: 12px 20px; text-align: center; font-size: 28px; font-weight: 700; color: #fff; min-width: 100px; flex-shrink: 0; }
    .roi-label { font-size: 8px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; }
    .col { display: flex; flex-direction: column; gap: 14px; }
    .section-label { font-size: 8px; color: #158158; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .metric-card { background: #F8F8F8; border: 1px solid #E8E8E8; border-left: 3px solid #158158; border-radius: 3px; padding: 10px 12px; }
    .metric-highlight { background: #EBF5F0; border: 2px solid #158158; }
    .metric-label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .metric-value { font-size: 16px; font-weight: 700; color: #0D0D0D; }
    .metric-value-lg { font-size: 20px; font-weight: 700; color: #0D6B48; }
    .bar-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px; color: #444; }
    .bar-amount { font-weight: 700; }
    .bar-track { height: 5px; background: #F5F5F5; border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
    .bar-fill { height: 100%; background: #158158; border-radius: 2px; }
    .net-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #EBF5F0; border: 1px solid #158158; border-radius: 3px; font-size: 12px; font-weight: 700; color: #0D6B48; margin-top: 8px; }
    .benchmarks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .benchmark-card { background: #0D0D0D; border-left: 2px solid #158158; border-radius: 2px; padding: 8px 10px; }
    .bench-stat { font-size: 14px; font-weight: 700; color: #22C97A; margin-bottom: 2px; }
    .bench-label { font-size: 9px; color: #888; line-height: 1.4; }
    .exec-box { background: #0D0D0D; border-radius: 4px; padding: 14px 16px; }
    .exec-text { font-size: 10px; color: #CCCCCC; line-height: 1.9; }
    .exec-text strong { color: #fff; }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .summary-table th { font-size: 8px; color: #158158; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; padding: 0 8px 8px 0; text-align: left; border-bottom: 2px solid #158158; }
    .summary-table td { padding: 9px 8px 9px 0; border-bottom: 1px solid #F0F0F0; }
    .page-footer { font-size: 8px; color: #888; text-align: right; margin-top: auto; padding-top: 16px; border-top: 1px solid #E8E8E8; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page, .title-page { page-break-after: always; }
    }
    /* Title page specific */
    .tp-logo { display: flex; align-items: center; gap: 12px; }
    .tp-logo-mark { width: 40px; height: 40px; background: #158158; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #fff; }
    .tp-logo-name { font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    .tp-divider { width: 60px; height: 4px; background: #158158; margin: 40px 0; }
    .tp-title { font-size: 36px; font-weight: 700; line-height: 1.2; margin-bottom: 12px; }
    .tp-subtitle { font-size: 14px; color: #888; margin-bottom: 6px; }
    .tp-customer { font-size: 18px; color: #22C97A; font-weight: 500; }
    .tp-stats { display: flex; gap: 24px; margin-top: 40px; }
    .tp-stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-top: 3px solid #158158; border-radius: 4px; padding: 16px 20px; }
    .tp-stat-val { font-size: 28px; font-weight: 700; color: #22C97A; margin-bottom: 4px; }
    .tp-stat-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; }
    .tp-footer { font-size: 9px; color: #444; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; background: #158158; color: #fff; border: none; border-radius: 4px; padding: 12px 20px; font-family: 'Roboto Mono', monospace; font-size: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.06em; z-index: 9999; }
    @media print { .print-btn { display: none; } }
  </style>
  </head><body>

  <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>

  <!-- TITLE PAGE -->
  <div class="title-page">
    <div>
      <div class="tp-logo">
        <div class="tp-logo-mark">A</div>
        <div class="tp-logo-name">augment code</div>
      </div>
      <div class="tp-divider"></div>
      <div class="tp-title">ROI Business Case</div>
      <div class="tp-subtitle">Prepared for</div>
      <div class="tp-customer">${customerName || "Your Company"}</div>
      <div class="tp-stats">
        ${[
          { label: "Total Annual Benefit", value: "$" + Math.round(grandTotal).toLocaleString() },
          { label: "Combined ROI", value: Math.round(grandROI) + "%" },
          { label: "Payback Period", value: grandPayback.toFixed(1) + " months" },
          { label: "FTEs Recovered", value: grandFTE.toFixed(1) + " FTEs" },
        ].map(s => `<div class="tp-stat"><div class="tp-stat-val">${s.value}</div><div class="tp-stat-label">${s.label}</div></div>`).join("")}
      </div>
    </div>
    <div class="tp-footer">
      <div>PRIVILEGED &amp; CONFIDENTIAL</div>
      <div style="margin-top:4px">${today}</div>
    </div>
  </div>

  <!-- SUMMARY PAGE -->
  ${summaryPage}

  <!-- PLAY PAGES -->
  ${allResults.map(playPage).join("")}

  </body></html>`;

  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 800);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const ALL_TABS = [...PLAYS.map(p => p.id), "summary"];
  const [activeTab, setActiveTab] = useState("code-review");
  const [customerName, setCustomerName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [scenarios, setScenarios] = useState({ "code-review": 1, "unit-test": 1, "build-failure": 1, "interactive": 1 });
  const [values, setValues] = useState(() => {
    const init = {};
    PLAYS.forEach(p => {
      init[p.id] = {};
      p.inputs.forEach(inp => { init[p.id][inp.key] = inp.default; });
    });
    return init;
  });

  const handleChange = useCallback((playId, key, val) => {
    setValues(prev => ({ ...prev, [playId]: { ...prev[playId], [key]: val } }));
  }, []);

  const allResults = PLAYS.map(play => {
    const si = scenarios[play.id];
    const pct = play.savingsRange[si];
    const vals = values[play.id];
    return { play, scenarioIdx: si, results: play.compute(vals, pct), augmentCost: vals.augmentCost };
  });

  const activePlay = PLAYS.find(p => p.id === activeTab);

  return (
    <div style={{ minHeight: "100vh", background: B.white, color: B.black, fontFamily: "'Roboto Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: ${B.green}; cursor: pointer;
          border: 2px solid ${B.white}; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.25); }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: ${B.green}; cursor: pointer; border: 2px solid ${B.white};
        }
        button { font-family: 'Roboto Mono', monospace; }
        input[type=text] { font-family: 'Roboto Mono', monospace; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: B.black, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 4, background: B.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: B.white }}>A</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: B.white, letterSpacing: "0.12em", textTransform: "uppercase" }}>augment code</span>
          <span style={{ color: B.darkGray, margin: "0 6px" }}>·</span>
          {editingName ? (
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === "Enter" && setEditingName(false)}
              autoFocus
              placeholder="Enter customer name…"
              style={{ background: "transparent", border: "none", borderBottom: `1px solid ${B.green}`, color: B.white, fontSize: 11, outline: "none", width: 200 }}
            />
          ) : (
            <span onClick={() => setEditingName(true)} style={{ fontSize: 11, color: customerName ? B.greenLight : B.gray, cursor: "pointer", borderBottom: `1px dashed ${B.darkGray}` }}>
              {customerName || "Click to add customer name"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 9, color: B.gray, letterSpacing: "0.1em", textTransform: "uppercase" }}>ROI Calculator</span>
          <button
            onClick={() => exportToPDF(allResults, customerName, scenarios)}
            style={{ background: B.green, border: "none", borderRadius: 4, padding: "7px 14px", cursor: "pointer", color: B.white, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            ⬇ Export PDF
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: B.offWhite, borderBottom: "1px solid #E0E0E0", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex" }}>
          {PLAYS.map((p, i) => (
            <button key={p.id} onClick={() => setActiveTab(p.id)} style={{
              background: "transparent", border: "none",
              borderBottom: activeTab === p.id ? `3px solid ${B.green}` : "3px solid transparent",
              padding: "13px 20px 10px", cursor: "pointer",
              color: activeTab === p.id ? B.green : B.gray,
              fontWeight: activeTab === p.id ? 700 : 500,
              fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: 2, background: activeTab === p.id ? B.green : "transparent", border: `1px solid ${activeTab === p.id ? B.green : B.gray}`, fontSize: 7, fontWeight: 700, color: activeTab === p.id ? B.white : B.gray }}>
                {p.number}
              </span>
              {p.label}
            </button>
          ))}
          <button onClick={() => setActiveTab("summary")} style={{
            background: "transparent", border: "none",
            borderBottom: activeTab === "summary" ? `3px solid ${B.green}` : "3px solid transparent",
            padding: "13px 20px 10px", cursor: "pointer",
            color: activeTab === "summary" ? B.green : B.gray,
            fontWeight: activeTab === "summary" ? 700 : 500,
            fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: 2, background: activeTab === "summary" ? B.green : "transparent", border: `1px solid ${activeTab === "summary" ? B.green : B.gray}`, fontSize: 7, fontWeight: 700, color: activeTab === "summary" ? B.white : B.gray }}>Σ</span>
            Summary
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      {activePlay ? (
        <PlayTab
          play={activePlay}
          vals={values[activePlay.id]}
          onChange={(key, val) => handleChange(activePlay.id, key, val)}
          scenarioIdx={scenarios[activePlay.id]}
          setScenarioIdx={(idx) => setScenarios(prev => ({ ...prev, [activePlay.id]: idx }))}
        />
      ) : (
        <SummaryTab allResults={allResults} scenarios={scenarios} customerName={customerName} />
      )}

      {/* ── FOOTER ── */}
      <div style={{ borderTop: "1px solid #E8E8E8", padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: B.offWhite }}>
        <span style={{ fontSize: 9, color: B.gray }}>* Illustrative estimates based on Augment Code pilot data and industry benchmarks. Actual results vary by org size, codebase complexity, and adoption rate.</span>
        <span style={{ fontSize: 9, color: B.gray, letterSpacing: "0.08em", textTransform: "uppercase" }}>PRIVILEGED &amp; CONFIDENTIAL · augment code</span>
      </div>
    </div>
  );
}
