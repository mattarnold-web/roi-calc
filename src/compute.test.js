import {
  USE_CASES,
  computeTokenPlusCosts,
  computePlatformFee,
  lookupPlatformFeeTier,
  splitTokenCost,
  suggestSurchargeRate,
  PLATFORM_FEE_TIERS,
  TOKEN_PLUS_DEFAULTS,
} from './App';

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
    const vals = { devs: 50, prsPerWeek: 75, hoursPerWeek: 5, hourlyCost: 120, reworkRate: 20,
      incidentValue: 150000, augmentCost: 180000 };
    const r = uc.compute(vals, 0.40, 'quality');
    expect(r.timeSavings).toBe(624000);
    expect(r.reworkSavings).toBeGreaterThan(0);
    // reworkSavings = (75*52) * (20/100) * 0.25 * 2 * 120 * 0.40 = 18,720
    expect(r.reworkSavings).toBeCloseTo(75*52*(20/100)*0.25*2*120*0.40, 0);
    expect(r.incidentValue).toBe(150000);
    expect(r.totalBenefit).toBe(624000 + r.reworkSavings + 150000);
  });

  it('capacity: uses senior dev inputs', () => {
    const vals = { seniorDevs: 15, seniorHoursPerWeek: 8, seniorHourlyCost: 160, augmentCost: 180000 };
    const r = uc.compute(vals, 0.40, 'capacity');
    // 15 × 8 × 52 × $160 × 40% = $399,360
    expect(r.timeSavings).toBe(399360);
    expect(r.hoursRecovered).toBe(15 * 8 * 52 * 0.40);
  });

  it('throughput: prsPerWeek slider scales time savings', () => {
    const base = { devs: 50, prsPerWeek: 75, hoursPerWeek: 5, hourlyCost: 120, augmentCost: 180000 };
    const rBase = uc.compute(base, 0.40, 'throughput');
    // Double PRs → double savings
    const doubled = { ...base, prsPerWeek: 150 };
    const rDouble = uc.compute(doubled, 0.40, 'throughput');
    expect(rDouble.timeSavings).toBe(rBase.timeSavings * 2);
    expect(rDouble.hoursRecovered).toBe(rBase.hoursRecovered * 2);
    // Half PRs → half savings
    const halved = { ...base, prsPerWeek: 37.5 };
    const rHalf = uc.compute(halved, 0.40, 'throughput');
    expect(rHalf.timeSavings).toBeCloseTo(rBase.timeSavings * 0.5, 0);
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
    const vals = { devs: 80, testHoursPerWeek: 4, hourlyCost: 120, incidentValue: 150000, augmentCost: 250000 };
    const r = uc.compute(vals, 0.50, 'velocity');
    // weeklyHours = 80*4 = 320;  timeSavings = 320*52*120*0.50 = $998,400
    expect(r.timeSavings).toBe(998400);
    expect(r.incidentValue).toBe(150000);
    expect(r.ciSavings).toBe(0);
    expect(r.totalBenefit).toBe(998400 + 150000);
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

  it('coverage: uses currentCoverage and criticalServices', () => {
    const vals = { devs: 80, testHoursPerWeek: 4, currentCoverage: 60, criticalServices: 5,
      hourlyCost: 120, incidentValue: 100000, augmentCost: 250000 };
    const r = uc.compute(vals, 0.50, 'coverage');
    expect(r.ciSavings).toBe(0);
    expect(r.incidentValue).toBe(100000);
    // With defaults, coverageFactor = (100-60)/40 * 5/5 = 1.0, same as velocity base
    expect(r.timeSavings).toBe(998400);
    // Higher current coverage → less room for improvement → lower savings
    const rHigh = uc.compute({ ...vals, currentCoverage: 80 }, 0.50, 'coverage');
    expect(rHigh.timeSavings).toBe(998400 * 0.5);
    // More critical services → more scope → higher savings
    const rMore = uc.compute({ ...vals, criticalServices: 10 }, 0.50, 'coverage');
    expect(rMore.timeSavings).toBe(998400 * 2);
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

  it('reliability: trunk lock + release delay, scales with pct', () => {
    const vals = { trunkLockHours: 4, devsBlocked: 50, hourlyCost: 130, releaseDelayValue: 200000, augmentCost: 200000 };
    const r = uc.compute(vals, 0.70, 'reliability');
    expect(r.trunkLockSavings).toBe(4 * 52 * 50 * 130 * 0.70);
    expect(r.releaseValue).toBe(200000 * 0.70);
    expect(r.timeSavings).toBe(0);
    // Scenario selector changes the result
    const rLow = uc.compute(vals, 0.50, 'reliability');
    expect(rLow.trunkLockSavings).toBe(4 * 52 * 50 * 130 * 0.50);
    expect(rLow.releaseValue).toBe(200000 * 0.50);
    expect(rLow.trunkLockSavings).toBeLessThan(r.trunkLockSavings);
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
    // onboardingValue = 2 * 40 * 20 * 120 * 0.80 = $153,600
    expect(r.onboardingValue).toBe(2 * 40 * 20 * 120 * 0.80);
    expect(r.productivityValue).toBeGreaterThan(0);
  });

  it('consolidation: adds retired tool spend', () => {
    const vals = { devs: 100, hrsSavedPerWeek: 3, hourlyCost: 120,
      retiredToolSpend: 60000, augmentCost: 240000 };
    const r = uc.compute(vals, 0.80, 'consolidation');
    expect(r.toolValue).toBe(60000);
  });
});

// ─── Every slider must affect output ───

describe('Every input slider affects totalBenefit or roi', () => {
  USE_CASES.forEach(uc => {
    uc.evalCategories.forEach(cat => {
      cat.inputs.forEach(inp => {
        it(`${uc.id} > ${cat.id}: changing "${inp.key}" changes output`, () => {
          const defaults = {};
          cat.inputs.forEach(i => { defaults[i.key] = i.default; });
          const base = uc.compute(defaults, uc.savingsRange[1], cat.id);
          const tweaked = { ...defaults, [inp.key]: inp.key === 'augmentCost' ? inp.default * 2 : inp.default * 1.5 };
          const result = uc.compute(tweaked, uc.savingsRange[1], cat.id);
          const changed = result.totalBenefit !== base.totalBenefit || result.roi !== base.roi;
          expect(changed).toBe(true);
        });
      });
    });
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

// ─── Token+ Pricing compute (spec §2.3.1, §3, §6) ───

describe('Platform fee tier lookup', () => {
  it('maps user count to the correct tier', () => {
    // Tier 1 (≤300)
    expect(lookupPlatformFeeTier(1).name).toBe('Tier 1');
    expect(lookupPlatformFeeTier(300).name).toBe('Tier 1');
    expect(lookupPlatformFeeTier(300).fee).toBe(50000);
    // Tier 2 (301–500)
    expect(lookupPlatformFeeTier(301).name).toBe('Tier 2');
    expect(lookupPlatformFeeTier(500).name).toBe('Tier 2');
    expect(lookupPlatformFeeTier(500).fee).toBe(100000);
    // Tier 3 (501–1000)
    expect(lookupPlatformFeeTier(501).name).toBe('Tier 3');
    expect(lookupPlatformFeeTier(1000).name).toBe('Tier 3');
    expect(lookupPlatformFeeTier(1000).fee).toBe(200000);
    // Tier 4 (1001–3000)
    expect(lookupPlatformFeeTier(1001).name).toBe('Tier 4');
    expect(lookupPlatformFeeTier(3000).name).toBe('Tier 4');
    expect(lookupPlatformFeeTier(3000).fee).toBe(300000);
    // Tier 5 (>3000) — custom
    expect(lookupPlatformFeeTier(3001).name).toBe('Tier 5');
    expect(lookupPlatformFeeTier(10000).name).toBe('Tier 5');
    expect(lookupPlatformFeeTier(10000).fee).toBeNull();
  });
});

describe('computePlatformFee', () => {
  it('uses tier list fee by default', () => {
    expect(computePlatformFee(450)).toBe(100000);
    expect(computePlatformFee(300)).toBe(50000);
    expect(computePlatformFee(1500)).toBe(300000);
  });

  it('applies discount to list fee', () => {
    expect(computePlatformFee(300, undefined, 0.10)).toBe(45000);
    expect(computePlatformFee(450, undefined, 0.25)).toBe(75000);
  });

  it('uses explicit override when provided (Tier 5 custom case)', () => {
    expect(computePlatformFee(5000, 500000)).toBe(500000);
    expect(computePlatformFee(5000, 500000, 0.10)).toBe(450000);
  });

  it('clamps discount to 0–1 range', () => {
    expect(computePlatformFee(300, undefined, -0.5)).toBe(50000);
    expect(computePlatformFee(300, undefined, 2)).toBe(0);
  });

  it('returns 0 when Tier 5 has no explicit list fee', () => {
    expect(computePlatformFee(10000)).toBe(0);
  });
});

describe('splitTokenCost', () => {
  it('splits total by pct_byok', () => {
    const s = splitTokenCost(1000, 0.4);
    expect(s.token_cost_byok).toBeCloseTo(400, 6);
    expect(s.token_cost_augment).toBeCloseTo(600, 6);
  });

  it('clamps pct_byok to 0–1', () => {
    expect(splitTokenCost(1000, 2).token_cost_byok).toBe(1000);
    expect(splitTokenCost(1000, -1).token_cost_byok).toBe(0);
  });
});

describe('suggestSurchargeRate', () => {
  it('uses the §2.3.2 helper tiers', () => {
    expect(suggestSurchargeRate(50000)).toBe(0.30);
    expect(suggestSurchargeRate(200000)).toBe(0.30);
    expect(suggestSurchargeRate(400000)).toBe(0.28);
    expect(suggestSurchargeRate(750000)).toBe(0.26);
    expect(suggestSurchargeRate(2000000)).toBe(0.24);
  });
});

describe('computeTokenPlusCosts — spec §6.1 (Hybrid fixture)', () => {
  const r = computeTokenPlusCosts({
    user_count: 450,
    platform_fee_list: 100000,
    platform_fee_discount_pct: 0,
    token_cost_augment: 200000,
    token_cost_byok: 300000,
    provider_discount_pct: 0.20,
    surcharge_rate: 0.30,
  });

  it('selects Tier 2', () => {
    expect(r.tierName).toBe('Tier 2');
    expect(r.tierIndex).toBe(1);
  });

  it('computes PlatformFee = 100,000', () => {
    expect(r.platformFee).toBe(100000);
  });

  it('computes token_cost_total = 500,000', () => {
    expect(r.tokenCostTotal).toBe(500000);
  });

  it('computes augment_surcharge = 150,000', () => {
    expect(r.augmentSurcharge).toBe(150000);
  });

  it('computes billed_cost = 350,000', () => {
    expect(r.billedCost).toBe(350000);
  });

  it('computes budget_used = 650,000', () => {
    expect(r.budgetUsed).toBe(650000);
  });

  it('computes provider_actual_cost = 240,000', () => {
    expect(r.providerActualCost).toBe(240000);
  });

  it('computes Augment_cost = 450,000 (feeds ROI)', () => {
    expect(r.augmentCost).toBe(450000);
  });

  it('computes Total_TCO = 690,000', () => {
    expect(r.totalTco).toBe(690000);
  });
});

describe('computeTokenPlusCosts — spec §6.2 (BYOK-only fixture)', () => {
  const r = computeTokenPlusCosts({
    user_count: 300,
    platform_fee_list: 50000,
    platform_fee_discount_pct: 0.10,
    token_cost_augment: 0,
    token_cost_byok: 400000,
    provider_discount_pct: 0.15,
    surcharge_rate: 0.30,
  });

  it('selects Tier 1', () => {
    expect(r.tierName).toBe('Tier 1');
    expect(r.tierIndex).toBe(0);
  });

  it('applies 10% platform discount → PlatformFee = 45,000', () => {
    expect(r.platformFee).toBe(45000);
  });

  it('computes token_cost_total = 400,000', () => {
    expect(r.tokenCostTotal).toBe(400000);
  });

  it('computes augment_surcharge = 120,000', () => {
    expect(r.augmentSurcharge).toBe(120000);
  });

  it('computes billed_cost = 120,000', () => {
    expect(r.billedCost).toBe(120000);
  });

  it('computes budget_used = 520,000', () => {
    expect(r.budgetUsed).toBe(520000);
  });

  it('computes provider_actual_cost = 340,000 (400k × 0.85)', () => {
    expect(r.providerActualCost).toBe(340000);
  });

  it('computes Augment_cost = 165,000', () => {
    expect(r.augmentCost).toBe(165000);
  });

  it('computes Total_TCO = 505,000', () => {
    expect(r.totalTco).toBe(505000);
  });
});

describe('computeTokenPlusCosts — derived inputs', () => {
  it('derives split from token_cost_total + pct_byok when explicit split absent', () => {
    const r = computeTokenPlusCosts({
      user_count: 450,
      token_cost_total: 500000,
      pct_byok: 0.6,
      surcharge_rate: 0.30,
    });
    expect(r.tokenCostByok).toBeCloseTo(300000, 6);
    expect(r.tokenCostAugment).toBeCloseTo(200000, 6);
    expect(r.augmentSurcharge).toBeCloseTo(150000, 6);
  });

  it('uses tier list when platform_fee_list omitted', () => {
    const r = computeTokenPlusCosts({
      user_count: 700,  // Tier 3 → 200k
      token_cost_total: 0,
      surcharge_rate: 0.30,
    });
    expect(r.platformFee).toBe(200000);
    expect(r.augmentCost).toBe(200000);
  });

  it('defaults match TOKEN_PLUS_DEFAULTS structurally', () => {
    const r = computeTokenPlusCosts({});
    // 500 users → Tier 2 (100k); token_cost_total 500k split 50/50; surcharge 30%
    expect(r.tierName).toBe('Tier 2');
    expect(r.platformFee).toBe(100000);
    expect(r.tokenCostTotal).toBe(500000);
    expect(r.augmentSurcharge).toBe(150000);
    expect(r.billedCost).toBe(400000);     // 250k hosted + 150k surcharge
    expect(r.augmentCost).toBe(500000);    // 100k platform + 400k billed
  });

  it('zero total token cost collapses to platform-only Augment cost', () => {
    const r = computeTokenPlusCosts({
      user_count: 300,
      token_cost_total: 0,
      surcharge_rate: 0.30,
    });
    expect(r.augmentSurcharge).toBe(0);
    expect(r.billedCost).toBe(0);
    expect(r.augmentCost).toBe(r.platformFee);
    expect(r.totalTco).toBe(r.platformFee);
  });

  it('clamps surcharge_rate to 0–1', () => {
    const r = computeTokenPlusCosts({
      user_count: 450,
      token_cost_total: 100000,
      pct_byok: 0,
      surcharge_rate: 2,
    });
    expect(r.surchargeRate).toBe(1);
    expect(r.augmentSurcharge).toBe(100000);
  });
});

describe('PLATFORM_FEE_TIERS reference table', () => {
  it('matches spec §2.3.1 fees and user ranges', () => {
    expect(PLATFORM_FEE_TIERS[0]).toMatchObject({ name:'Tier 1', fee:50000,  maxUsers:300  });
    expect(PLATFORM_FEE_TIERS[1]).toMatchObject({ name:'Tier 2', fee:100000, maxUsers:500  });
    expect(PLATFORM_FEE_TIERS[2]).toMatchObject({ name:'Tier 3', fee:200000, maxUsers:1000 });
    expect(PLATFORM_FEE_TIERS[3]).toMatchObject({ name:'Tier 4', fee:300000, maxUsers:3000 });
    expect(PLATFORM_FEE_TIERS[4].name).toBe('Tier 5');
    expect(PLATFORM_FEE_TIERS[4].fee).toBeNull();
  });

  it('TOKEN_PLUS_DEFAULTS has the spec default surcharge rate', () => {
    expect(TOKEN_PLUS_DEFAULTS.surcharge_rate).toBe(0.30);
  });
});

