# Augment Code ROI Calculator — Calculation Methodology

> Complete breakdown of every formula, metric, and cost estimation algorithm used in the ROI calculator.

---

## Table of Contents

1. [How the Calculator Works](#how-the-calculator-works)
2. [Use Case 01: Code Review](#use-case-01-code-review)
3. [Use Case 02: Unit Test Automation](#use-case-02-unit-test-automation)
4. [Use Case 03: Build Failure Analyzer](#use-case-03-build-failure-analyzer)
5. [Use Case 04: Interactive (IDE + CLI)](#use-case-04-interactive-ide--cli)
6. [Ballpark Cost Estimator](#ballpark-cost-estimator)
7. [Summary Tab Aggregation](#summary-tab-aggregation)
8. [Scenario System](#scenario-system)
9. [Pilot Success Thresholds](#pilot-success-thresholds)
10. [Metric Formats & Definitions](#metric-formats--definitions)

---

## How the Calculator Works

Every use case follows the same structure:

1. **Inputs** — Business parameters (team size, hours, cost rates) entered via sliders
2. **Scenario** — A savings percentage selected from Conservative / Midpoint / Optimistic
3. **Compute** — A formula multiplies inputs × scenario percentage to produce benefit metrics
4. **Cost** — Augment platform cost, set by the Ballpark Cost Estimator on the Summary tab
5. **ROI** — `(Total Benefit − Cost) / Cost × 100`

### Core Formulas (shared across all use cases)

| Metric | Formula |
|--------|---------|
| **ROI %** | `((totalBenefit − augmentCost) / augmentCost) × 100` |
| **Payback Period** | `augmentCost / (totalBenefit / 12)` months |
| **FTE Equivalent** | `hoursRecovered / 2,080` (standard annual work hours) |
| **Net Benefit** | `totalBenefit − augmentCost` |
| **ROI Multiple** | `totalBenefit / augmentCost` (displayed as "X.X×") |

---

## Use Case 01: Code Review

**Savings Range:** Conservative 30% · Midpoint 40% · Optimistic 50%

### Category A: Review Throughput

Focus: PR volume, cycle time, merge velocity.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 50 | 1–5,000 | Engineers in review |
| `prsPerMonth` | 300 | 10–50,000 | PRs per month (org-wide) |
| `hoursPerWeek` | 5 | 0.5–40 | Hours/week per engineer on review |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |

**Formulas:**

```
prFactor       = prsPerMonth / 300
timeSavings    = devs × hoursPerWeek × 52 × hourlyCost × pct × prFactor
hoursRecovered = devs × hoursPerWeek × 52 × pct × prFactor
totalBenefit   = timeSavings
```

*The `prFactor` scales linearly — an org doing 600 PRs/month gets 2× the throughput benefit vs. the 300 baseline.*

### Category B: Quality & Risk

Focus: Bug prevention, incidents, change failure rate.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 50 | 1–5,000 | Engineers in review |
| `hoursPerWeek` | 5 | 0.5–40 | Hours/week per engineer on review |
| `reworkRate` | 20% | 0–80% | % PRs requiring major rework cycles |
| `incidentValue` | $150,000 | $0–$5M | Annual value of avoided incidents |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |

**Formulas:**

```
timeSavings    = devs × hoursPerWeek × 52 × hourlyCost × pct
reworkSavings  = (prsPerMonth × 12) × (reworkRate / 100) × 0.25 × 2 × hourlyCost × 0.30
totalBenefit   = timeSavings + reworkSavings + incidentValue
hoursRecovered = devs × hoursPerWeek × 52 × pct
```

*Rework savings assumes 25% of rework PRs are caught earlier, each saves ~2 hours of rework, with a 30% Augment effectiveness factor. `incidentValue` is added directly as avoided-incident value.*

### Category C: Senior Time Recapture

Focus: Reviewer hours freed and FTE capacity model.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `seniorDevs` | 15 | 1–1,000 | Senior engineers doing review |
| `seniorHoursPerWeek` | 8 | 1–40 | Hours/week seniors spend on review |
| `seniorHourlyCost` | $160 | $80–$500 | Senior engineer fully loaded cost ($/hr) |

**Formulas:**

```
timeSavings    = seniorDevs × seniorHoursPerWeek × 52 × seniorHourlyCost × pct
hoursRecovered = seniorDevs × seniorHoursPerWeek × 52 × pct
totalBenefit   = timeSavings
```

---

## Use Case 02: Unit Test Automation

**Savings Range:** Conservative 30% · Midpoint 50% · Optimistic 70%

### Category A: Developer Velocity

Focus: Time savings and developer hours reclaimed.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 80 | 1–5,000 | Engineers writing/maintaining tests |
| `testTimePct` | 10% | 1–30% | % of week spent on unit tests |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |
| `incidentValue` | $150,000 | $0–$5M | Annual value of avoided defects |

**Formulas:**

```
weeklyHours    = devs × 40 × (testTimePct / 100)
timeSavings    = weeklyHours × 52 × hourlyCost × pct
totalBenefit   = timeSavings + incidentValue
hoursRecovered = weeklyHours × 52 × pct
```

### Category B: Coverage Expansion

Focus: Coverage % gains and test quality.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 80 | 1–5,000 | Engineers writing/maintaining tests |
| `testTimePct` | 10% | 1–30% | % of week spent on unit tests |
| `currentCoverage` | 60% | 0–100% | Current avg unit test coverage |
| `criticalServices` | 5 | 1–100 | # of critical services in scope |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |
| `incidentValue` | $150,000 | $0–$5M | Annual value of avoided defects |

**Formulas:**

```
coverageFactor = ((100 − currentCoverage) / 40) × (criticalServices / 5)
weeklyHours    = devs × 40 × (testTimePct / 100)
timeSavings    = weeklyHours × 52 × hourlyCost × pct × coverageFactor
totalBenefit   = timeSavings + incidentValue
hoursRecovered = weeklyHours × 52 × pct × coverageFactor
```

*`coverageFactor` amplifies benefit when coverage is low (more room to gain) and when more critical services are in scope. At 60% coverage and 5 services, the factor = 1.0 (baseline). At 40% coverage and 10 services, the factor = 3.0.*

### Category C: CI Stability

Focus: CI failure reduction and time-to-green.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `ciFailuresPerWeek` | 30 | 0–500 | Test-related CI failures per week |
| `mttrPerCIFailure` | 1.5 hrs | 0.25–8 | Avg hours to remediate a CI failure |
| `peoplePerCIFailure` | 1.5 | 1–10 | Avg engineers pulled in per failure |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |

**Formulas:**

```
annualFailures = ciFailuresPerWeek × 52
currentCost    = annualFailures × mttrPerCIFailure × peoplePerCIFailure × hourlyCost
ciSavings      = currentCost × pct
totalBenefit   = ciSavings            (no incidentValue for this category)
hoursRecovered = annualFailures × mttrPerCIFailure × peoplePerCIFailure × pct
```

---

## Use Case 03: Build Failure Analyzer

**Savings Range:** Conservative 50% · Midpoint 70% · Optimistic 80%

### Category A: MTTR Reduction

Focus: Time-to-green and remediation speed.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `failuresPerWeek` | 50 | 1–5,000 | Build failures per week |
| `mttrHours` | 3 hrs | 0.25–24 | Current MTTR per failure (hours) |
| `peoplePerFailure` | 2 | 1–20 | Avg engineers per failure |
| `hourlyCost` | $130 | $50–$400 | Blended hourly cost (dev + SRE) |

**Formulas:**

```
annualFailures = failuresPerWeek × 52
timeSavings    = annualFailures × mttrHours × peoplePerFailure × hourlyCost × pct
totalBenefit   = timeSavings
hoursRecovered = annualFailures × mttrHours × peoplePerFailure × pct
newMttr        = mttrHours × (1 − pct)     ← projected MTTR after Augment
```

### Category B: Triage Automation

Focus: Auto-classification, routing, ownership clarity.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `failuresPerWeek` | 50 | 1–5,000 | Build failures per week |
| `triageHoursPerFailure` | 1.5 hrs | 0.25–8 | Hours spent triaging per failure |
| `triagePeople` | 2 | 1–10 | People involved in triage per failure |
| `hourlyCost` | $130 | $50–$400 | Blended hourly cost (dev + SRE) |

**Formulas:**

```
annualFailures = failuresPerWeek × 52
currentCost    = annualFailures × triageHoursPerFailure × triagePeople × hourlyCost
timeSavings    = currentCost × pct
totalBenefit   = timeSavings
hoursRecovered = annualFailures × triageHoursPerFailure × triagePeople × pct
```

### Category C: Pipeline Reliability

Focus: Trunk lock, release velocity, blocked developer cost.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `trunkLockHours` | 4 hrs | 0–40 | Avg trunk lock duration per week |
| `devsBlocked` | 50 | 1–2,000 | Devs blocked during trunk lock |
| `hourlyCost` | $130 | $50–$400 | Blended hourly cost |
| `releaseDelayValue` | $200,000 | $0–$5M | Annual value of avoided release delays |

**Formulas:**

```
trunkLockSavings = trunkLockHours × 52 × devsBlocked × hourlyCost × pct × 0.6
releaseValue     = releaseDelayValue       ← added directly
totalBenefit     = trunkLockSavings + releaseValue
hoursRecovered   = trunkLockHours × 52 × devsBlocked × pct × 0.6
```

*The 0.6 factor accounts for the fact that not all blocked-developer time is fully productive even when unblocked (context switching, partial overlap).*

---

## Use Case 04: Interactive (IDE + CLI)

**Savings Range:** Conservative 60% · Midpoint 80% · Optimistic 100%

### Category A: Individual Productivity

Focus: Hours saved per developer per week.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 100 | 1–10,000 | Active interactive users (IDE/CLI) |
| `hrsSavedPerWeek` | 3 hrs | 0.5–15 | Hours saved per dev per week |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |

**Formulas:**

```
annualHours      = devs × hrsSavedPerWeek × 52
productivityValue = annualHours × pct × hourlyCost
totalBenefit     = productivityValue
hoursRecovered   = annualHours × pct
```

### Category B: Team Onboarding

Focus: Ramp time savings for new hires and transfers.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 100 | 1–10,000 | Active interactive users (IDE/CLI) |
| `hrsSavedPerWeek` | 3 hrs | 0.5–15 | Hours saved per dev per week |
| `onboardingWeeksSaved` | 2 wks | 0–12 | Onboarding weeks saved per new hire |
| `newDevsPerYear` | 20 | 0–500 | New hires / major transfers per year |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |

**Formulas:**

```
annualHours       = devs × hrsSavedPerWeek × 52
productivityValue = annualHours × pct × hourlyCost
onboardingValue   = onboardingWeeksSaved × 40 × newDevsPerYear × hourlyCost
totalBenefit      = productivityValue + onboardingValue
hoursRecovered    = annualHours × pct
```

*Onboarding value is independent of the scenario percentage — it represents the fixed value of getting new hires productive faster.*

### Category C: Tool Consolidation

Focus: Retired tool spend and cost savings.

| Input | Default | Range | Description |
|-------|---------|-------|-------------|
| `devs` | 100 | 1–10,000 | Active interactive users (IDE/CLI) |
| `hrsSavedPerWeek` | 3 hrs | 0.5–15 | Hours saved per dev per week |
| `hourlyCost` | $120 | $50–$400 | Fully loaded engineer cost ($/hr) |
| `retiredToolSpend` | $60,000 | $0–$2M | Annual retired tool spend (Copilot, etc.) |

**Formulas:**

```
annualHours       = devs × hrsSavedPerWeek × 52
productivityValue = annualHours × pct × hourlyCost
toolValue         = retiredToolSpend       ← added directly
totalBenefit      = productivityValue + toolValue
hoursRecovered    = annualHours × pct
```

---

## Ballpark Cost Estimator

The Ballpark Cost Estimator replaces manual per-category cost sliders with an automated, spec-driven pricing model.

### Platform Tiers (FY27)

| Tier | Annual Fee | Max Developers |
|------|-----------|----------------|
| **Core** | $50,000 | 200 |
| **Standard** | $100,000 | 1,000 |
| **Advanced** | $150,000 | Unlimited |

### Tier Selection

```
totalDevs = MAX(devs or seniorDevs values across all enabled use cases and categories)
tier      = first tier where totalDevs ≤ tier.maxDevs
```

### Investment Range Calculation

The estimator targets a **2–4× ROI multiple** (benefit ÷ cost):

```
rawLow  = totalBenefit / 4          ← investment needed for 4× ROI (aggressive)
rawHigh = totalBenefit / 2          ← investment needed for 2× ROI (conservative)

investmentLow  = MAX(tier.fee, rawLow)     ← floor at platform minimum
investmentHigh = MAX(tier.fee, rawHigh)     ← floor at platform minimum
```

### Credit Pool Estimation

Enterprise credits are priced at **$1 = 500 credits**:

```
creditSpendLow  = MAX(0, investmentLow − tier.fee)
creditSpendHigh = MAX(0, investmentHigh − tier.fee)

creditsLow  = creditSpendLow × 500
creditsHigh = creditSpendHigh × 500
```

### Low / High Estimate Selection

Users choose which end of the range to use for ROI calculations:

| Selection | Investment Used | ROI Target |
|-----------|----------------|------------|
| **Low Estimate** | `investmentLow` | ~4× ROI (higher return) |
| **High Estimate** | `investmentHigh` | ~2× ROI (conservative return) |

The selected value is injected as `augmentCost` into every use case's compute function.

### Disclaimer

> This is an illustrative estimate only, not a binding quote. Actual Augment pricing depends on contract terms, negotiated discounts, promotional credits, and usage patterns. Contact your Augment account team for a formal proposal.

---

## Summary Tab Aggregation

### Grand Totals (across all enabled use cases and categories)

```
grandTotal   = Σ (each category's totalBenefit)
grandCost    = selectedBallparkCost        ← from Ballpark Cost Estimator
grandNet     = grandTotal − grandCost
grandROI     = ((grandTotal − grandCost) / grandCost) × 100
grandPayback = grandCost / (grandTotal / 12)     ← in months
grandHours   = Σ (each category's hoursRecovered)
grandFTE     = Σ (each category's fteEquivalent)
```

### Per-Use-Case Aggregation (within a single use case tab)

```
combinedBenefit = Σ (each enabled category's totalBenefit)
combinedCost    = platformCost        ← same ballpark cost for all use cases
combinedROI     = ((combinedBenefit − combinedCost) / combinedCost) × 100
roiMultiple     = combinedBenefit / combinedCost    ← displayed as "X.X×"
combinedHours   = Σ (each category's hoursRecovered)
combinedFTE     = combinedHours / 2,080
```

### Benefit Distribution

```
For each category:
  share = (category.totalBenefit / grandTotal) × 100%
```

Displayed as horizontal bar charts on the Summary tab.

---

## Scenario System

Each use case defines three scenarios representing different levels of expected impact:

| Use Case | Conservative | Midpoint | Optimistic |
|----------|-------------|----------|------------|
| Code Review | 30% | 40% | 50% |
| Unit Test Automation | 30% | 50% | 70% |
| Build Failure Analyzer | 50% | 70% | 80% |
| Interactive (IDE + CLI) | 60% | 80% | 100% |

- **Default:** Midpoint (index 1) for all categories
- **Per-category:** Each category within a use case can independently select a scenario
- **Usage:** The selected percentage (`pct`) is multiplied into the time-savings and hours-recovered formulas

---

## Pilot Success Thresholds

Thresholds are optional pilot tracking metrics. Each has a target value; the UI shows progress with color coding.

### Color Logic

| Condition | Color | Meaning |
|-----------|-------|---------|
| Value = 0 | Gray | Not yet evaluated |
| Value ≥ target | Green | Threshold met |
| Value ≥ 75% of target | Amber | Approaching target |
| Value < 75% of target | Red | Below target |

### Code Review Thresholds

| Metric | Target | Unit |
|--------|--------|------|
| % Faster Time-to-First-Review | ≥ 40% | % |
| Augment Comment Address Rate | ≥ 55% | % |
| % Eligible PRs Receiving Augment Review | ≥ 70% | % |
| Senior Time Freed (hrs/week self-reported) | ≥ 3 | hrs |

### Unit Test Thresholds

| Metric | Target | Unit |
|--------|--------|------|
| % Reduction in Test-Writing Time (pilot modules) | ≥ 50% | % |
| Coverage Gain on Pilot Targets | ≥ 20 | pts |
| % Generated Tests Considered Correct / Usable | ≥ 80% | % |

### Build Failure Thresholds

| Metric | Target | Unit |
|--------|--------|------|
| % Reduction in Average Triage Time | ≥ 60% | % |
| % Faster MTTR (Red-to-Green) | ≥ 70% | % |
| % of Failures Auto-Classified / Routed | ≥ 65% | % |

### Interactive

No pilot success thresholds defined (successThresholds = null).

### Pilot Success Score

```
metCount    = count of thresholds where value ≥ target
totalCount  = total number of thresholds for this use case
successScore = metCount / totalCount      ← displayed as "X/Y"
```

---

## Metric Formats & Definitions

| Format Key | Display | Example |
|------------|---------|---------|
| `dollar` | `$X,XXX` | `$1,560,000` |
| `percent` | `X%` | `312%` |
| `hours` | `X,XXX hrs` | `13,000 hrs` |
| `fte` | `X.X FTEs` | `6.3 FTEs` |

### Key Constants

| Constant | Value | Usage |
|----------|-------|-------|
| 52 | Weeks per year | All annual calculations |
| 40 | Hours per work week | Test time %, onboarding |
| 2,080 | Annual work hours (40 × 52) | FTE conversion |
| 500 | Enterprise credits per $1 | Ballpark credit estimation |
| 12 | Months per year | Payback period conversion |

---

*This document is auto-generated from the ROI calculator source code. All formulas correspond to the `compute()` functions defined in `src/App.js`.*
