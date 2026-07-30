/**
 * Civilizational Pathways Simulation Engine
 * Models global civilization from 1900-2500 across multiple dimensions:
 * population, development convergence, energy transition, polycrisis stress,
 * and civilizational sustainability (Scivilization).
 *
 * Based on: "Civilizational Pathways" — H Heuristics Strategic Architecture Report, July 2026
 */

const Simulation = (() => {
  // ── Constants from the report ──────────────────────────────────────────
  const START_YEAR = 1900;
  const END_YEAR = 2500;
  const TOTAL_YEARS = END_YEAR - START_YEAR + 1;

  // Peak population ~9.8B around 2050, equilibrium ~2.5B by 2500
  const PEAK_POP = 9.8;       // billion
  const EQUILIBRIUM_POP = 2.5; // billion by 2500
  const PEAK_YEAR = 2050;

  // TFR targets from report
  const TFR_PEAK = 5.0;       // 1950s-60s global average
  const TFR_REPLACEMENT = 2.1;
  const TFR_TARGET = 1.25;    // target for managed contraction

  // Wet-bulb limits
  const TWB_LETHAL = 35.0;    // °C — theoretical limit
  const TWB_STRESS = 30.5;    // °C — empirical metabolic stress onset

  // Warming scenario
  const WARMING_BY_2100 = 3.5; // °C above pre-industrial (unmitigated reference)

  // ── Region definitions — country names match TopoJSON properties.name ──
  const REGIONS = {
    'North America': {
      countries: ['Canada', 'United States of America', 'Mexico', 'Guatemala', 'Honduras',
                  'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Belize',
                  'Bahamas', 'Cuba', 'Jamaica', 'Haiti', 'Dominican Rep.',
                  'Puerto Rico', 'Greenland', 'Trinidad and Tobago'],
      latRange: [15, 70],
      basePop2025: 0.60,
      baseTFR2025: 1.7,
      devIndex2025: 0.88,
      fossilPct2025: 0.62
    },
    'South America': {
      countries: ['Brazil', 'Argentina', 'Colombia', 'Peru', 'Venezuela', 'Chile',
                  'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname',
                  'Falkland Is.'],
      latRange: [-55, 12],
      basePop2025: 0.44,
      baseTFR2025: 1.9,
      devIndex2025: 0.72,
      fossilPct2025: 0.55
    },
    'Europe': {
      countries: ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Poland',
                  'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Finland', 'Denmark',
                  'Austria', 'Switzerland', 'Portugal', 'Greece', 'Ireland', 'Czechia',
                  'Hungary', 'Romania', 'Ukraine', 'Bulgaria', 'Serbia', 'Croatia',
                  'Slovakia', 'Slovenia', 'Lithuania', 'Latvia', 'Estonia',
                  'Bosnia and Herz.', 'Macedonia', 'Montenegro', 'Albania', 'Kosovo',
                  'Luxembourg', 'Iceland', 'Cyprus', 'Moldova', 'N. Cyprus'],
      latRange: [36, 70],
      basePop2025: 0.74,
      baseTFR2025: 1.5,
      devIndex2025: 0.91,
      fossilPct2025: 0.48
    },
    'Russia & Central Asia': {
      countries: ['Russia', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan',
                  'Tajikistan', 'Mongolia', 'Belarus', 'Georgia', 'Armenia', 'Azerbaijan'],
      latRange: [35, 75],
      basePop2025: 0.24,
      baseTFR2025: 1.8,
      devIndex2025: 0.68,
      fossilPct2025: 0.70
    },
    'North Africa & Middle East': {
      countries: ['Egypt', 'Algeria', 'Morocco', 'Tunisia', 'Libya', 'Sudan',
                  'Saudi Arabia', 'Iran', 'Iraq', 'Syria', 'Jordan', 'Israel',
                  'United Arab Emirates', 'Qatar', 'Kuwait', 'Oman', 'Yemen',
                  'Lebanon', 'Turkey', 'W. Sahara', 'Palestine', 'Mauritania'],
      latRange: [12, 42],
      basePop2025: 0.58,
      baseTFR2025: 2.6,
      devIndex2025: 0.62,
      fossilPct2025: 0.82
    },
    'Sub-Saharan Africa': {
      countries: ['Nigeria', 'Ethiopia', 'Dem. Rep. Congo', 'South Africa', 'Tanzania',
                  'Kenya', 'Uganda', 'Ghana', 'Mozambique', 'Angola', "Côte d'Ivoire",
                  'Cameroon', 'Madagascar', 'Niger', 'Burkina Faso', 'Mali', 'Malawi',
                  'Zambia', 'Senegal', 'Chad', 'Somalia', 'Zimbabwe', 'Rwanda', 'Burundi',
                  'S. Sudan', 'Benin', 'Togo', 'Sierra Leone', 'Liberia', 'Guinea',
                  'Guinea-Bissau', 'Gambia', 'Eritrea', 'Djibouti', 'Botswana',
                  'Namibia', 'Lesotho', 'Gabon', 'Congo', 'Eq. Guinea', 'Central African Rep.',
                  'Somaliland', 'eSwatini'],
      latRange: [-35, 15],
      basePop2025: 1.22,
      baseTFR2025: 4.4,
      devIndex2025: 0.38,
      fossilPct2025: 0.45
    },
    'South Asia': {
      countries: ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Afghanistan', 'Bhutan'],
      latRange: [5, 37],
      basePop2025: 1.94,
      baseTFR2025: 2.1,
      devIndex2025: 0.52,
      fossilPct2025: 0.68
    },
    'East Asia': {
      countries: ['China', 'Japan', 'South Korea', 'North Korea', 'Taiwan'],
      latRange: [20, 50],
      basePop2025: 1.64,
      baseTFR2025: 1.2,
      devIndex2025: 0.78,
      fossilPct2025: 0.65
    },
    'Southeast Asia & Oceania': {
      countries: ['Indonesia', 'Philippines', 'Vietnam', 'Thailand', 'Myanmar',
                  'Malaysia', 'Australia', 'New Zealand', 'Papua New Guinea',
                  'Cambodia', 'Laos', 'Brunei', 'Timor-Leste',
                  'Solomon Is.', 'Fiji', 'Vanuatu', 'New Caledonia'],
      latRange: [-40, 23],
      basePop2025: 0.75,
      baseTFR2025: 2.0,
      devIndex2025: 0.60,
      fossilPct2025: 0.58
    }
  };

  // ── Utility functions ──────────────────────────────────────────────────
  function sigmoid(x, midpoint = 0.5, steepness = 10) {
    return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function smoothstep(t) { return t * t * (3 - 2 * t); }

  // ── Core simulation state ──────────────────────────────────────────────
  let data = null; // Will hold all year-indexed arrays

  /**
   * Build per-year arrays for every metric, every region.
   * Returns a structure: data[metric][yearIndex] = value or {region: value}
   */
  function buildSimulation() {
    const global = {
      population: new Float64Array(TOTAL_YEARS),
      tfr: new Float64Array(TOTAL_YEARS),
      devIndex: new Float64Array(TOTAL_YEARS),
      fossilPct: new Float64Array(TOTAL_YEARS),
      cleanPct: new Float64Array(TOTAL_YEARS),
      toxicity: new Float64Array(TOTAL_YEARS),
      wetbulbRisk: new Float64Array(TOTAL_YEARS),
      scivilization: new Float64Array(TOTAL_YEARS),
      co2ppm: new Float64Array(TOTAL_YEARS),
      warming: new Float64Array(TOTAL_YEARS),
      urbanPct: new Float64Array(TOTAL_YEARS)
    };

    const regional = {};
    for (const r of Object.keys(REGIONS)) {
      regional[r] = {
        population: new Float64Array(TOTAL_YEARS),
        tfr: new Float64Array(TOTAL_YEARS),
        devIndex: new Float64Array(TOTAL_YEARS),
        fossilPct: new Float64Array(TOTAL_YEARS),
        toxicity: new Float64Array(TOTAL_YEARS),
        wetbulbRisk: new Float64Array(TOTAL_YEARS),
        urbanPct: new Float64Array(TOTAL_YEARS)
      };
    }

    // ── Simulate each region, then aggregate to global ──────────────────
    for (const [name, cfg] of Object.entries(REGIONS)) {
      simulateRegion(cfg, regional[name]);
    }

    // Aggregate global metrics
    for (let y = 0; y < TOTAL_YEARS; y++) {
      let totalPop = 0, weightedTfr = 0, weightedDev = 0, weightedFossil = 0;
      let totalTox = 0, totalWbRisk = 0, totalUrban = 0;

      for (const r of Object.values(regional)) {
        const pop = r.population[y];
        totalPop += pop;
        weightedTfr += r.tfr[y] * pop;
        weightedDev += r.devIndex[y] * pop;
        weightedFossil += r.fossilPct[y] * pop;
        totalTox += r.toxicity[y] * pop;
        totalWbRisk += r.wetbulbRisk[y] * pop;
        totalUrban += r.urbanPct[y] * pop;
      }

      if (totalPop > 0) {
        weightedTfr /= totalPop;
        weightedDev /= totalPop;
        weightedFossil /= totalPop;
        totalTox /= totalPop;
        totalWbRisk /= totalPop;
        totalUrban /= totalPop;
      }

      global.population[y] = totalPop;
      global.tfr[y] = weightedTfr;
      global.devIndex[y] = weightedDev;
      global.fossilPct[y] = weightedFossil;
      global.cleanPct[y] = 1.0 - weightedFossil;
      global.toxicity[y] = totalTox;
      global.wetbulbRisk[y] = totalWbRisk;
      global.urbanPct[y] = totalUrban;

      // CO2 trajectory: rise to ~550ppm by 2100, then managed drawdown
      const year = START_YEAR + y;
      if (year <= 2025) {
        global.co2ppm[y] = lerp(296, 425, (year - 1900) / 125);
      } else if (year <= 2100) {
        const t = (year - 2025) / 75;
        global.co2ppm[y] = lerp(425, 540, t);
      } else if (year <= 2200) {
        const t = (year - 2100) / 100;
        global.co2ppm[y] = lerp(540, 450, smoothstep(t));
      } else {
        const t = (year - 2200) / 300;
        global.co2ppm[y] = lerp(450, 350, smoothstep(t));
      }

      // Warming trajectory
      if (year <= 2025) {
        global.warming[y] = lerp(0, 1.2, (year - 1900) / 125);
      } else if (year <= 2100) {
        const t = (year - 2025) / 75;
        global.warming[y] = lerp(1.2, WARMING_BY_2100, t);
      } else if (year <= 2200) {
        const t = (year - 2100) / 100;
        global.warming[y] = lerp(WARMING_BY_2100, WARMING_BY_2100 + 1.0, t); // +1°C inertia
      } else {
        const t = (year - 2200) / 300;
        global.warming[y] = lerp(WARMING_BY_2100 + 1.0, 2.5, smoothstep(t)); // slow recovery
      }

      // Scivilization = f(D_tech × C_convergence / (P_impact × T_toxicity))
      // Simplified: devIndex * cleanPct / (toxicity * wetbulbRisk)
      const D = global.devIndex[y];
      const C = global.cleanPct[y] + 0.01;
      const P = 0.5 + 0.5 * (global.population[y] / PEAK_POP); // normalised impact
      const T = global.toxicity[y] + global.wetbulbRisk[y] + 0.01;
      global.scivilization[y] = clamp((D * C) / (P * T), 0, 1);
    }

    data = { global, regional, regions: REGIONS };
    return data;
  }

  /**
   * Simulate a single region across all years.
   */
  function simulateRegion(cfg, out) {
    const {
      basePop2025, baseTFR2025, devIndex2025, fossilPct2025, latRange
    } = cfg;

    const avgLat = (Math.abs(latRange[0]) + Math.abs(latRange[1])) / 2;
    const latFactor = clamp(1 - (avgLat / 55), 0.05, 1.0); // tropical = higher risk

    for (let y = 0; y < TOTAL_YEARS; y++) {
      const year = START_YEAR + y;
      const tNorm = (year - START_YEAR) / (END_YEAR - START_YEAR); // 0..1 over 1900-2500

      // ── Population ──────────────────────────────────────────────────
      let pop;

      if (year <= 2025) {
        // Historical: logistic growth from 1900 base to 2025 base
        const base1900 = basePop2025 * 0.35; // rough 1900 estimate
        const t = (year - 1900) / 125;
        pop = lerp(base1900, basePop2025, smoothstep(t));
      } else if (year <= PEAK_YEAR) {
        // Growth to peak (with decelerating rate)
        const peakPop = basePop2025 * 1.15; // ~15% above 2025 by 2050
        const t = (year - 2025) / (PEAK_YEAR - 2025);
        pop = lerp(basePop2025, peakPop, Math.pow(t, 0.6)); // decelerating growth
      } else if (year <= 2150) {
        // Key inflection: managed decline begins
        const t = (year - PEAK_YEAR) / (2150 - PEAK_YEAR);
        const inflectionPop = lerp(1.0, 0.75, t); // fraction of peak
        pop = PEAK_POP * (basePop2025 / PEAK_POP) * inflectionPop;
        // Scale by region's share of global peak
        const peakRegional = basePop2025 * 1.15;
        pop = peakRegional * inflectionPop;
      } else {
        // Long managed descent toward equilibrium
        const t = (year - 2150) / (2500 - 2150);
        const regionalEq = basePop2025 * (EQUILIBRIUM_POP / PEAK_POP);
        const peakRegional = basePop2025 * 1.15;
        pop = lerp(peakRegional * 0.75, regionalEq, smoothstep(t));
      }
      out.population[y] = Math.max(pop, 0.001);

      // ── TFR ─────────────────────────────────────────────────────────
      let tfr;
      if (year <= 1965) {
        // Peak TFR era
        const peakTfr = baseTFR2025 * 2.2;
        tfr = lerp(TFR_PEAK, peakTfr, (year - 1900) / 65);
      } else if (year <= 2025) {
        // Rapid decline to current
        tfr = lerp(baseTFR2025 * 2.2, baseTFR2025, smoothstep((year - 1965) / 60));
      } else if (year <= 2100) {
        // Convergence toward managed TFR
        const t = (year - 2025) / 75;
        tfr = lerp(baseTFR2025, TFR_TARGET, smoothstep(t));
      } else {
        // Stable low TFR
        tfr = TFR_TARGET + (Math.random() - 0.5) * 0.05 * 0; // no noise
      }
      out.tfr[y] = clamp(tfr, 0.6, TFR_PEAK);

      // ── Development Index ───────────────────────────────────────────
      let dev;
      if (year <= 2025) {
        const base1900 = devIndex2025 * 0.2;
        dev = lerp(base1900, devIndex2025, smoothstep((year - 1900) / 125));
      } else if (year <= 2100) {
        // Convergence acceleration: developing regions catch up faster
        const t = (year - 2025) / 75;
        dev = lerp(devIndex2025, 0.95, smoothstep(t));
      } else {
        // Full development maturity
        dev = lerp(0.95, 0.98, smoothstep((year - 2100) / 400));
      }
      out.devIndex[y] = clamp(dev, 0.05, 0.99);

      // ── Fossil Fuel Percentage ───────────────────────────────────────
      let fossil;
      if (year <= 2025) {
        fossil = lerp(0.95, fossilPct2025, (year - 1900) / 125);
      } else if (year <= 2075) {
        // Rapid clean transition (SMRs, EGS, solar)
        const t = (year - 2025) / 50;
        fossil = lerp(fossilPct2025, 0.15, smoothstep(t));
      } else if (year <= 2150) {
        const t = (year - 2075) / 75;
        fossil = lerp(0.15, 0.05, smoothstep(t));
      } else {
        fossil = 0.05;
      }
      out.fossilPct[y] = clamp(fossil, 0.03, 0.95);

      // ── Toxicity Loading ─────────────────────────────────────────────
      // Peaks during industrial era, declines with clean transition + depopulation
      let tox;
      if (year <= 1950) {
        tox = lerp(0.05, 0.20, (year - 1900) / 50);
      } else if (year <= 2025) {
        tox = lerp(0.20, 0.70, (year - 1950) / 75);
      } else if (year <= 2075) {
        // Peak toxicity as legacy + new loading compete with mitigation
        const t = (year - 2025) / 50;
        tox = lerp(0.70, 0.95, t) * (1 - 0.2 * t); // peak around 2050
        tox = 0.70 + 0.25 * Math.sin(t * Math.PI); // bell curve: 0.70→0.95→0.70
      } else if (year <= 2200) {
        const t = (year - 2075) / 125;
        tox = lerp(0.70, 0.25, smoothstep(t));
      } else {
        const t = (year - 2200) / 300;
        tox = lerp(0.25, 0.08, smoothstep(t));
      }
      out.toxicity[y] = clamp(tox, 0.01, 1.0);

      // ── Wet-Bulb Risk ────────────────────────────────────────────────
      // Driven by warming + latitude (tropical zones hit harder)
      let wbRisk;
      const warming = (() => {
        if (year <= 2025) return lerp(0, 1.2, (year - 1900) / 125);
        if (year <= 2100) return lerp(1.2, WARMING_BY_2100, (year - 2025) / 75);
        if (year <= 2200) return lerp(WARMING_BY_2100, WARMING_BY_2100 + 1.0, (year - 2100) / 100);
        return lerp(WARMING_BY_2100 + 1.0, 2.5, smoothstep((year - 2200) / 300));
      })();

      // Risk scales with warming × latitude factor
      if (year <= 2025) {
        wbRisk = lerp(0.02, 0.18 * latFactor, (year - 1900) / 125);
      } else if (year <= 2100) {
        wbRisk = lerp(0.18, 0.65, (year - 2025) / 75) * latFactor;
      } else if (year <= 2200) {
        wbRisk = lerp(0.65, 0.55, (year - 2100) / 100) * latFactor;
      } else {
        wbRisk = lerp(0.55, 0.25, smoothstep((year - 2200) / 300)) * latFactor;
      }
      out.wetbulbRisk[y] = clamp(wbRisk, 0.005, 0.95);

      // ── Urbanization ─────────────────────────────────────────────────
      let urban;
      if (year <= 2025) {
        urban = lerp(0.10, 0.56, smoothstep((year - 1900) / 125));
      } else if (year <= 2100) {
        // Managed urban consolidation
        urban = lerp(0.56, 0.82, smoothstep((year - 2025) / 75));
      } else {
        // Ultra-urban enclave model
        urban = lerp(0.82, 0.92, smoothstep((year - 2100) / 400));
      }
      out.urbanPct[y] = clamp(urban, 0.05, 0.95);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────
  function getData() {
    if (!data) data = buildSimulation();
    return data;
  }

  function getYearIndex(year) {
    return clamp(Math.round(year - START_YEAR), 0, TOTAL_YEARS - 1);
  }

  function getGlobalValue(metric, year) {
    const d = getData();
    const idx = getYearIndex(year);
    return d.global[metric][idx];
  }

  function getRegionalValue(region, metric, year) {
    const d = getData();
    const idx = getYearIndex(year);
    return d.regional[region]?.[metric]?.[idx] ?? 0;
  }

  function getRegionNames() {
    return Object.keys(REGIONS);
  }

  function getCountryToRegion() {
    const map = {};
    for (const [region, cfg] of Object.entries(REGIONS)) {
      for (const iso of cfg.countries) {
        map[iso] = region;
      }
    }
    return map;
  }

  function getPhaseForYear(year) {
    if (year < 2026) return { name: 'Pre-Transition', color: '#4a5568', phase: 0 };
    if (year <= 2050) return { name: 'Phase I: Grid Hardening', color: '#e53e3e', phase: 1 };
    if (year <= 2100) return { name: 'Phase II: Post-Growth', color: '#dd6b20', phase: 2 };
    if (year <= 2200) return { name: 'Phase III: Rewilding Era', color: '#38a169', phase: 3 };
    return { name: 'Long Equilibrium', color: '#3182ce', phase: 4 };
  }

  // Initialize on load
  function init() {
    getData();
    return data;
  }

  return {
    init, getData, getYearIndex,
    getGlobalValue, getRegionalValue,
    getRegionNames, getCountryToRegion,
    getPhaseForYear,
    START_YEAR, END_YEAR, TOTAL_YEARS,
    PEAK_YEAR, PEAK_POP, EQUILIBRIUM_POP,
    TFR_TARGET, TWB_STRESS, TWB_LETHAL,
    REGIONS
  };
})();

// Auto-initialize
if (typeof window !== 'undefined') {
  window.Simulation = Simulation;
}
