import { USE_CASES, fmt, B } from './App';

// ─── Data structure integrity ───

describe('USE_CASES structure', () => {
  it('has exactly 4 use cases', () => {
    expect(USE_CASES).toHaveLength(4);
  });

  it('each use case has required fields', () => {
    const required = ['id', 'label', 'number', 'tagline', 'description',
      'savingsRange', 'savingsLabel', 'evalCategories', 'compute', 'metrics', 'benchmarks'];
    USE_CASES.forEach(uc => {
      required.forEach(field => {
        expect(uc).toHaveProperty(field);
      });
    });
  });

  it('IDs are unique', () => {
    const ids = USE_CASES.map(uc => uc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('numbers are unique sequential strings', () => {
    const nums = USE_CASES.map(uc => uc.number);
    expect(nums).toEqual(['01', '02', '03', '04']);
  });

  it('savingsRange is [low, mid, high] with 0 < low < mid < high <= 1', () => {
    USE_CASES.forEach(uc => {
      expect(uc.savingsRange).toHaveLength(3);
      const [lo, mid, hi] = uc.savingsRange;
      expect(lo).toBeGreaterThan(0);
      expect(mid).toBeGreaterThan(lo);
      expect(hi).toBeGreaterThan(mid);
      expect(hi).toBeLessThanOrEqual(1);
    });
  });

  it('each evalCategory has id, label, desc, and inputs array', () => {
    USE_CASES.forEach(uc => {
      expect(uc.evalCategories.length).toBeGreaterThan(0);
      uc.evalCategories.forEach(cat => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('desc');
        expect(cat.inputs.length).toBeGreaterThan(0);
      });
    });
  });

  it('each input has key, label, default, min, max, step, unit', () => {
    USE_CASES.forEach(uc => {
      uc.evalCategories.forEach(cat => {
        cat.inputs.forEach(inp => {
          ['key', 'label', 'default', 'min', 'max', 'step'].forEach(f => {
            expect(inp).toHaveProperty(f);
          });
          expect(inp).toHaveProperty('unit');
          expect(inp.default).toBeGreaterThanOrEqual(inp.min);
          expect(inp.default).toBeLessThanOrEqual(inp.max);
        });
      });
    });
  });

  it('each metric has key, label, format', () => {
    USE_CASES.forEach(uc => {
      uc.metrics.forEach(m => {
        expect(m).toHaveProperty('key');
        expect(m).toHaveProperty('label');
        expect(['dollar', 'percent', 'hours', 'fte']).toContain(m.format);
      });
    });
  });

  it('each use case has exactly 4 benchmarks', () => {
    USE_CASES.forEach(uc => {
      expect(uc.benchmarks).toHaveLength(4);
      uc.benchmarks.forEach(b => {
        expect(b).toHaveProperty('stat');
        expect(b).toHaveProperty('label');
      });
    });
  });
});

// ─── fmt helper ───

describe('fmt', () => {
  it('formats dollars', () => {
    expect(fmt(1234567, 'dollar')).toBe('$1,234,567');
    expect(fmt(0, 'dollar')).toBe('$0');
  });

  it('formats percentages', () => {
    expect(fmt(42.7, 'percent')).toBe('43%');
    expect(fmt(-15, 'percent')).toBe('-15%');
  });

  it('formats hours', () => {
    expect(fmt(5200, 'hours')).toBe('5,200 hrs');
  });

  it('formats FTEs', () => {
    expect(fmt(2.567, 'fte')).toBe('2.6 FTEs');
  });

  it('returns dash for undefined/null/NaN', () => {
    expect(fmt(undefined, 'dollar')).toBe('—');
    expect(fmt(null, 'percent')).toBe('—');
    expect(fmt(NaN, 'hours')).toBe('—');
  });

  it('returns string for unknown format', () => {
    expect(fmt(42, 'unknown')).toBe('42');
  });
});

// ─── Brand colors ───

describe('B (brand colors)', () => {
  it('has core brand colors', () => {
    expect(B.green).toBe('#158158');
    expect(B.black).toBe('#0D0D0D');
    expect(B.white).toBe('#FFFFFF');
  });

  it('all values are hex color strings', () => {
    Object.values(B).forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

