import { USE_CASES } from './App';

const findUseCase = (id) => USE_CASES.find(uc => uc.id === id);

// ─── Code Review compute ───

describe('Code Review compute', () => {
  const uc = findUseCase('code-review');

  it('throughput: calculates time savings with defaults at midpoint', () => {
    const defaults = { devs: 50, hoursPerWeek: 5, hourlyCost: 120, augmentCost: 180000 };
    const r = uc.compute(defaults, 0.40, 'throughput');
    // 50 devs × 5 hrs/wk × 52 wks × $120/hr × 40% = $624,000
    expect(r.timeSavings).toBe(624000);
    expect(r.reworkSavings).toBe(0);
    expect(r.totalBenefit).toBe(624000);
    expect(r.roi).toBeCloseTo(((624000 - 180000) / 180000) * 100, 2);
    expect(r.payback).toBeCloseTo(180000 / (624000 / 12), 2);
    expect(r.hoursRecovered).toBe(50 * 5 * 52 * 0.40);
    expect(r.fteEquivalent).toBeCloseTo(r.hoursRecovered / 2080, 4);
  });

  it('quality: adds rework savings and incident value', () => {
    const vals = { devs: 50, hoursPerWeek: 5, hourlyCost: 120, reworkRate: 20,
      prsPerMonth: 300, incidentValue: 150000, augmentCost: 180000 };
    const r = uc.compute(vals, 0.40, 'quality');
    expect(r.timeSavings).toBe(624000);
    expect(r.reworkSavings).toBeGreaterThan(0);
    // reworkSavings = (300*12) * (20/100) * 0.25 * 2 * 120 * 0.30 = 12,960
    expect(r.reworkSavings).toBeCloseTo(12960, 0);
    expect(r.incidentValue).toBe(150000);
    expect(r.totalBenefit).toBe(624000 + 12960 + 150000);
  });

  it('capacity: uses senior dev inputs', () => {
    const vals = { seniorDevs: 15, seniorHoursPerWeek: 8, seniorHourlyCost: 160, augmentCost: 180000 };
    const r = uc.compute(vals, 0.40, 'capacity');
    // 15 × 8 × 52 × $160 × 40% = $399,360
    expect(r.timeSavings).toBe(399360);
    expect(r.hoursRecovered).toBe(15 * 8 * 52 * 0.40);
  });

  it('throughput: prsPerMonth slider scales time savings', () => {
    const base = { devs: 50, prsPerMonth: 300, hoursPerWeek: 5, hourlyCost: 120, augmentCost: 180000 };
    const rBase = uc.compute(base, 0.40, 'throughput');
    // Double PRs → double savings
    const doubled = { ...base, prsPerMonth: 600 };
    const rDouble = uc.compute(doubled, 0.40, 'throughput');
    expect(rDouble.timeSavings).toBe(rBase.timeSavings * 2);
    expect(rDouble.hoursRecovered).toBe(rBase.hoursRecovered * 2);
    // Half PRs → half savings
    const halved = { ...base, prsPerMonth: 150 };
    const rHalf = uc.compute(halved, 0.40, 'throughput');
    expect(rHalf.timeSavings).toBe(rBase.timeSavings * 0.5);
  });

  it('returns correct ROI formula', () => {
    const vals = { devs: 10, hoursPerWeek: 5, hourlyCost: 100, augmentCost: 50000 };
    const r = uc.compute(vals, 0.50, 'throughput');
    const benefit = 10 * 5 * 52 * 100 * 0.50;
    expect(r.roi).toBeCloseTo(((benefit - 50000) / 50000) * 100, 2);
  });
});

// ─── Unit Test compute ───

describe('Unit Test compute', () => {
  const uc = findUseCase('unit-test');

  it('velocity: weekly test hours converted to annual savings', () => {
    const vals = { devs: 80, testTimePct: 10, hourlyCost: 120, incidentValue: 150000, augmentCost: 250000 };
    const r = uc.compute(vals, 0.50, 'velocity');
    // weeklyHours = 80*40*(10/100) = 320;  timeSavings = 320*52*120*0.50 = $998,400
    expect(r.timeSavings).toBe(998400);
    expect(r.incidentValue).toBe(150000);
    expect(r.totalBenefit).toBeGreaterThan(r.timeSavings); // includes ciSavings + incident
  });

  it('ci-stability: uses CI failure inputs', () => {
    const vals = { ciFailuresPerWeek: 30, mttrPerCIFailure: 1.5, peoplePerCIFailure: 1.5, hourlyCost: 120, augmentCost: 250000 };
    const r = uc.compute(vals, 0.50, 'ci-stability');
    const annual = 30 * 52;
    const cost = annual * 1.5 * 1.5 * 120;
    expect(r.ciSavings).toBeCloseTo(cost * 0.50, 0);
    expect(r.timeSavings).toBe(0);
    expect(r.incidentValue).toBe(0); // CI-stability zeroes out incident
  });

  it('coverage: no ciSavings', () => {
    const vals = { devs: 80, testTimePct: 10, hourlyCost: 120, incidentValue: 100000, augmentCost: 250000 };
    const r = uc.compute(vals, 0.50, 'coverage');
    expect(r.ciSavings).toBe(0);
    expect(r.incidentValue).toBe(100000);
  });
});

// ─── Build Failure compute ───

describe('Build Failure compute', () => {
  const uc = findUseCase('build-failure');

  it('mttr: annual MTTR savings', () => {
    const vals = { failuresPerWeek: 50, mttrHours: 3, peoplePerFailure: 2, hourlyCost: 130, augmentCost: 200000 };
    const r = uc.compute(vals, 0.70, 'mttr');
    // 50*52 * 3 * 2 * 130 * 0.70 = $1,415,960 (adjusted for rounding)
    expect(r.timeSavings).toBe(50 * 52 * 3 * 2 * 130 * 0.70);
    expect(r.newMttr).toBeCloseTo(3 * 0.30, 4);
  });

  it('triage: triage hours calculation', () => {
    const vals = { failuresPerWeek: 50, triageHoursPerFailure: 1.5, triagePeople: 2, hourlyCost: 130, augmentCost: 200000 };
    const r = uc.compute(vals, 0.70, 'triage');
    const annual = 50 * 52;
    expect(r.timeSavings).toBe(annual * 1.5 * 2 * 130 * 0.70);
    expect(r.newMttr).toBeNull(); // Only mttr category has newMttr
  });

  it('reliability: trunk lock + release delay', () => {
    const vals = { trunkLockHours: 4, devsBlocked: 50, hourlyCost: 130, releaseDelayValue: 200000, augmentCost: 200000 };
    const r = uc.compute(vals, 0.70, 'reliability');
    expect(r.trunkLockSavings).toBe(4 * 52 * 50 * 130 * 0.5 * 0.6);
    expect(r.releaseValue).toBe(200000);
    expect(r.timeSavings).toBe(0);
  });
});

// ─── Interactive compute ───

describe('Interactive compute', () => {
  const uc = findUseCase('interactive');

  it('productivity: direct hours × cost', () => {
    const vals = { devs: 100, hrsSavedPerWeek: 3, hourlyCost: 120, augmentCost: 240000 };
    const r = uc.compute(vals, 0.80, 'productivity');
    // 100*3*52 = 15600 annual hrs; × 0.80 × $120 = $1,497,600
    expect(r.productivityValue).toBe(100 * 3 * 52 * 0.80 * 120);
    expect(r.onboardingValue).toBe(0);
    expect(r.toolValue).toBe(0);
  });

  it('onboarding: adds onboarding ramp savings', () => {
    const vals = { devs: 100, hrsSavedPerWeek: 3, hourlyCost: 120,
      onboardingWeeksSaved: 2, newDevsPerYear: 20, augmentCost: 240000 };
    const r = uc.compute(vals, 0.80, 'onboarding');
    // onboardingValue = 2 * 40 * 20 * 120 = $192,000
    expect(r.onboardingValue).toBe(2 * 40 * 20 * 120);
    expect(r.productivityValue).toBeGreaterThan(0);
  });

  it('consolidation: adds retired tool spend', () => {
    const vals = { devs: 100, hrsSavedPerWeek: 3, hourlyCost: 120,
      retiredToolSpend: 60000, augmentCost: 240000 };
    const r = uc.compute(vals, 0.80, 'consolidation');
    expect(r.toolValue).toBe(60000);
  });
});

// ─── Cross-cutting compute properties ───

describe('Compute results invariants', () => {
  it('all compute functions return required keys', () => {
    const required = ['totalBenefit', 'roi', 'payback', 'hoursRecovered', 'fteEquivalent'];
    USE_CASES.forEach(uc => {
      uc.evalCategories.forEach(cat => {
        const defaults = {};
        cat.inputs.forEach(inp => { defaults[inp.key] = inp.default; });
        const r = uc.compute(defaults, uc.savingsRange[1], cat.id);
        required.forEach(key => {
          expect(r).toHaveProperty(key);
          expect(typeof r[key]).toBe('number');
        });
      });
    });
  });

  it('default inputs produce positive total benefit at midpoint', () => {
    USE_CASES.forEach(uc => {
      uc.evalCategories.forEach(cat => {
        const defaults = {};
        cat.inputs.forEach(inp => { defaults[inp.key] = inp.default; });
        const r = uc.compute(defaults, uc.savingsRange[1], cat.id);
        expect(r.totalBenefit).toBeGreaterThan(0);
        // ROI may be negative for narrow single-category views (e.g. CI-stability alone)
        // but payback should be finite and positive
        expect(r.payback).toBeGreaterThan(0);
        expect(r.payback).toBeLessThan(24);
      });
    });
  });
});

