/**
 * Civilizational Pathways — Chart Panels
 * Four synchronized D3 charts (A–D) driven by the simulation engine.
 */

const Charts = (() => {
  // ── Shared config ──────────────────────────────────────────────────────
  const PHASES = [
    { start: 1900, end: 2025, label: 'Pre-Transition', color: '#4a5568' },
    { start: 2026, end: 2050, label: 'Phase I: Grid Hardening', color: '#e53e3e' },
    { start: 2051, end: 2100, label: 'Phase II: Post-Growth', color: '#dd6b20' },
    { start: 2101, end: 2200, label: 'Phase III: Rewilding', color: '#38a169' },
    { start: 2201, end: 2500, label: 'Long Equilibrium', color: '#3182ce' }
  ];

  const COLORS = {
    pop: '#f0b429',
    tfr: '#a78bfa',
    devIndex: '#2dd4bf',
    fossil: '#f87171',
    clean: '#4ade80',
    toxicity: '#fb923c',
    wetbulbRisk: '#ef4444',
    sciv: '#60a5fa',
    grid: '#1e2d3d',
    text: '#64748b',
    yearLine: '#f0b429'
  };

  let currentYear = 2025;
  let yearLineGroup = null;

  // ── Initialize all four panels ────────────────────────────────────────

  function init() {
    drawPopulationChart();
    drawEnergyChart();
    drawPolycrisisChart();
    drawScivilizationChart();
  }

  // ── Update year line across all charts ────────────────────────────────

  function updateYear(year) {
    currentYear = year;
    // Redraw all charts with updated year line
    drawPopulationChart();
    drawEnergyChart();
    drawPolycrisisChart();
    drawScivilizationChart();
  }

  // ── Panel A: Population & TFR ─────────────────────────────────────────

  function drawPopulationChart() {
    const svg = d3.select('#chart-population');
    svg.selectAll('*').remove();
    const container = document.querySelector('#chart-population').parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W <= 0 || H <= 0) return;

    const sim = Simulation.getData();
    const margin = { top: 8, right: 40, bottom: 24, left: 44 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([1900, 2500]).range([0, w]);
    const yPop = d3.scaleLinear().domain([0, 10.5]).range([h, 0]);
    const yTfr = d3.scaleLinear().domain([0, 5.5]).range([h, 0]);

    // Draw phase backgrounds
    drawPhaseBackgrounds(g, xScale, h);

    // Grid
    g.append('g').attr('class', 'chart-grid')
      .call(d3.axisLeft(yPop).ticks(4).tickSize(-w).tickFormat(''));

    // Population area + line
    const popData = Array.from(sim.global.population).map((v, i) => ({ year: 1900 + i, value: v }));
    const areaPop = d3.area().x(d => xScale(d.year)).y0(h).y1(d => yPop(d.value)).curve(d3.curveMonotoneX);
    g.append('path').datum(popData).attr('class', 'chart-area').attr('d', areaPop).attr('fill', COLORS.pop);
    g.append('path').datum(popData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yPop(d.value)).curve(d3.curveMonotoneX)(popData)
    ).attr('stroke', COLORS.pop);

    // TFR line
    const tfrData = Array.from(sim.global.tfr).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(tfrData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yTfr(d.value)).curve(d3.curveMonotoneX)(tfrData)
    ).attr('stroke', COLORS.tfr).attr('stroke-dasharray', '3 2');

    // Replacement line
    g.append('line').attr('class', 'chart-threshold')
      .attr('x1', xScale(1900)).attr('x2', xScale(2500))
      .attr('y1', yTfr(2.1)).attr('y2', yTfr(2.1))
      .attr('stroke', COLORS.tfr).attr('stroke-opacity', 0.3);

    // Target TFR line
    g.append('line').attr('class', 'chart-threshold')
      .attr('x1', xScale(2025)).attr('x2', xScale(2500))
      .attr('y1', yTfr(1.25)).attr('y2', yTfr(1.25))
      .attr('stroke', COLORS.tfr).attr('stroke-opacity', 0.15);

    // Axes
    g.append('g').attr('class', 'chart-axis').call(d3.axisLeft(yPop).ticks(4).tickFormat(d => d + 'B'));
    g.append('g').attr('class', 'chart-axis').attr('transform', `translate(0,${h})`).call(
      d3.axisBottom(xScale).ticks(12).tickFormat(d => d)
    );
    g.append('g').attr('class', 'chart-axis').attr('transform', `translate(${w},0)`)
      .call(d3.axisRight(yTfr).ticks(4).tickFormat(d => d.toFixed(1)));

    // Labels
    g.append('text').attr('class', 'chart-label').attr('x', 6).attr('y', 10)
      .text('Pop (B)').attr('fill', COLORS.pop);
    g.append('text').attr('class', 'chart-label').attr('x', w - 4).attr('y', 10)
      .text('TFR').attr('fill', COLORS.tfr).attr('text-anchor', 'end');

    // Current year line
    g.append('line').attr('class', 'chart-year-line')
      .attr('x1', xScale(currentYear)).attr('x2', xScale(currentYear))
      .attr('y1', 0).attr('y2', h);
  }

  // ── Panel B: Energy & Development ─────────────────────────────────────

  function drawEnergyChart() {
    const svg = d3.select('#chart-energy');
    svg.selectAll('*').remove();
    const container = document.querySelector('#chart-energy').parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W <= 0 || H <= 0) return;

    const sim = Simulation.getData();
    const margin = { top: 8, right: 12, bottom: 24, left: 42 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([1900, 2500]).range([0, w]);
    const yPct = d3.scaleLinear().domain([0, 1]).range([h, 0]);
    const yDev = d3.scaleLinear().domain([0, 1]).range([h, 0]);

    drawPhaseBackgrounds(g, xScale, h);

    g.append('g').attr('class', 'chart-grid')
      .call(d3.axisLeft(yPct).ticks(4).tickSize(-w).tickFormat(''));

    // Fossil %
    const fossilData = Array.from(sim.global.fossilPct).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(fossilData).attr('class', 'chart-area').attr('d',
      d3.area().x(d => xScale(d.year)).y0(h).y1(d => yPct(d.value)).curve(d3.curveMonotoneX)(fossilData)
    ).attr('fill', COLORS.fossil);
    g.append('path').datum(fossilData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yPct(d.value)).curve(d3.curveMonotoneX)(fossilData)
    ).attr('stroke', COLORS.fossil);

    // Clean %
    const cleanData = Array.from(sim.global.cleanPct).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(cleanData).attr('class', 'chart-area').attr('d',
      d3.area().x(d => xScale(d.year)).y0(h).y1(d => yPct(d.value)).curve(d3.curveMonotoneX)(cleanData)
    ).attr('fill', COLORS.clean);
    g.append('path').datum(cleanData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yPct(d.value)).curve(d3.curveMonotoneX)(cleanData)
    ).attr('stroke', COLORS.clean);

    // Development Index
    const devData = Array.from(sim.global.devIndex).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(devData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yDev(d.value)).curve(d3.curveMonotoneX)(devData)
    ).attr('stroke', COLORS.devIndex).attr('stroke-width', 2.5);

    // Axes
    g.append('g').attr('class', 'chart-axis').call(d3.axisLeft(yPct).ticks(4).tickFormat(d3.format('.0%')));
    g.append('g').attr('class', 'chart-axis').attr('transform', `translate(0,${h})`).call(
      d3.axisBottom(xScale).ticks(12).tickFormat(d => d)
    );

    // Labels
    g.append('text').attr('class', 'chart-label').attr('x', 6).attr('y', 10).text('Share');

    // Legend
    const legend = g.append('g').attr('transform', `translate(${w - 140}, 4)`);
    [{c: COLORS.fossil, l: 'Fossil'}, {c: COLORS.clean, l: 'Clean'}, {c: COLORS.devIndex, l: 'Dev Idx'}]
      .forEach((d, i) => {
        legend.append('rect').attr('x', 0).attr('y', i * 14).attr('width', 10).attr('height', 3)
          .attr('fill', d.c).attr('rx', 1);
        legend.append('text').attr('x', 14).attr('y', i * 14 + 4).text(d.l)
          .attr('fill', COLORS.text).attr('font-size', '9px').attr('font-family', 'JetBrains Mono, monospace');
      });

    // Current year line
    g.append('line').attr('class', 'chart-year-line')
      .attr('x1', xScale(currentYear)).attr('x2', xScale(currentYear)).attr('y1', 0).attr('y2', h);
  }

  // ── Panel C: Polycrisis Stress ────────────────────────────────────────

  function drawPolycrisisChart() {
    const svg = d3.select('#chart-polycrisis');
    svg.selectAll('*').remove();
    const container = document.querySelector('#chart-polycrisis').parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W <= 0 || H <= 0) return;

    const sim = Simulation.getData();
    const margin = { top: 8, right: 12, bottom: 24, left: 42 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([1900, 2500]).range([0, w]);
    const yRisk = d3.scaleLinear().domain([0, 1]).range([h, 0]);
    const yWarm = d3.scaleLinear().domain([0, 5]).range([h, 0]);

    drawPhaseBackgrounds(g, xScale, h);

    g.append('g').attr('class', 'chart-grid')
      .call(d3.axisLeft(yRisk).ticks(4).tickSize(-w).tickFormat(''));

    // Toxicity
    const toxData = Array.from(sim.global.toxicity).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(toxData).attr('class', 'chart-area').attr('d',
      d3.area().x(d => xScale(d.year)).y0(h).y1(d => yRisk(d.value)).curve(d3.curveMonotoneX)(toxData)
    ).attr('fill', COLORS.toxicity);
    g.append('path').datum(toxData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yRisk(d.value)).curve(d3.curveMonotoneX)(toxData)
    ).attr('stroke', COLORS.toxicity);

    // Wet-Bulb Risk
    const wbData = Array.from(sim.global.wetbulbRisk).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(wbData).attr('class', 'chart-area').attr('d',
      d3.area().x(d => xScale(d.year)).y0(h).y1(d => yRisk(d.value)).curve(d3.curveMonotoneX)(wbData)
    ).attr('fill', COLORS.wetbulbRisk);
    g.append('path').datum(wbData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yRisk(d.value)).curve(d3.curveMonotoneX)(wbData)
    ).attr('stroke', COLORS.wetbulbRisk);

    // Warming (on second axis)
    const warmData = Array.from(sim.global.warming).map((v, i) => ({ year: 1900 + i, value: v }));
    g.append('path').datum(warmData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yWarm(d.value)).curve(d3.curveMonotoneX)(warmData)
    ).attr('stroke', '#e2e8f0').attr('stroke-dasharray', '4 2').attr('stroke-width', 1);

    // Critical threshold (30.5°C wet-bulb equivalent on risk scale)
    g.append('line').attr('class', 'chart-threshold')
      .attr('x1', xScale(2020)).attr('x2', xScale(2500))
      .attr('y1', yRisk(0.5)).attr('y2', yRisk(0.5))
      .attr('stroke', COLORS.wetbulbRisk).attr('stroke-opacity', 0.4);

    // Axes
    g.append('g').attr('class', 'chart-axis').call(d3.axisLeft(yRisk).ticks(4).tickFormat(d3.format('.0%')));
    g.append('g').attr('class', 'chart-axis').attr('transform', `translate(0,${h})`).call(
      d3.axisBottom(xScale).ticks(12).tickFormat(d => d)
    );

    // Legend
    const legend = g.append('g').attr('transform', `translate(${w - 140}, 4)`);
    [{c: COLORS.toxicity, l: 'Toxicity'}, {c: COLORS.wetbulbRisk, l: 'Wet-Bulb'}, {c: '#e2e8f0', l: 'Warming °C'}]
      .forEach((d, i) => {
        legend.append('rect').attr('x', 0).attr('y', i * 14).attr('width', 10).attr('height', 3)
          .attr('fill', d.c).attr('rx', 1);
        legend.append('text').attr('x', 14).attr('y', i * 14 + 4).text(d.l)
          .attr('fill', COLORS.text).attr('font-size', '9px').attr('font-family', 'JetBrains Mono, monospace');
      });

    // Current year line
    g.append('line').attr('class', 'chart-year-line')
      .attr('x1', xScale(currentYear)).attr('x2', xScale(currentYear)).attr('y1', 0).attr('y2', h);
  }

  // ── Panel D: Scivilization Score ──────────────────────────────────────

  function drawScivilizationChart() {
    const svg = d3.select('#chart-scivilization');
    svg.selectAll('*').remove();
    const container = document.querySelector('#chart-scivilization').parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W <= 0 || H <= 0) return;

    const sim = Simulation.getData();
    const margin = { top: 8, right: 16, bottom: 24, left: 42 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([1900, 2500]).range([0, w]);
    const yScale = d3.scaleLinear().domain([0, 0.9]).range([h, 0]);

    drawPhaseBackgrounds(g, xScale, h);

    g.append('g').attr('class', 'chart-grid')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-w).tickFormat(''));

    // Scivilization area + line
    const scivData = Array.from(sim.global.scivilization).map((v, i) => ({ year: 1900 + i, value: v }));
    const area = d3.area().x(d => xScale(d.year)).y0(h).y1(d => yScale(d.value)).curve(d3.curveMonotoneX);
    g.append('path').datum(scivData).attr('class', 'chart-area').attr('d', area).attr('fill', COLORS.sciv);
    g.append('path').datum(scivData).attr('class', 'chart-line').attr('d',
      d3.line().x(d => xScale(d.year)).y(d => yScale(d.value)).curve(d3.curveMonotoneX)(scivData)
    ).attr('stroke', COLORS.sciv).attr('stroke-width', 2.5);

    // Threshold bands
    const bands = [
      { y: 0.7, color: '#4ade80', label: 'Sustainable', opacity: 0.08 },
      { y: 0.45, color: '#f0b429', label: 'Stressed', opacity: 0.06 },
      { y: 0.2, color: '#f87171', label: 'Critical', opacity: 0.08 }
    ];
    bands.forEach(b => {
      g.append('rect').attr('x', 0).attr('width', w)
        .attr('y', yScale(b.y)).attr('height', h - yScale(b.y))
        .attr('fill', b.color).attr('opacity', b.opacity);
      g.append('line').attr('class', 'chart-threshold')
        .attr('x1', 0).attr('x2', w).attr('y1', yScale(b.y)).attr('y2', yScale(b.y))
        .attr('stroke', b.color).attr('stroke-opacity', 0.3);
    });

    // Axes
    g.append('g').attr('class', 'chart-axis').call(d3.axisLeft(yScale).ticks(5));
    g.append('g').attr('class', 'chart-axis').attr('transform', `translate(0,${h})`).call(
      d3.axisBottom(xScale).ticks(12).tickFormat(d => d)
    );

    // Labels
    bands.forEach((b, i) => {
      g.append('text').attr('x', w - 4).attr('y', yScale(b.y) - 3)
        .text(b.label).attr('fill', b.color).attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace').attr('text-anchor', 'end');
    });

    // Current year line
    g.append('line').attr('class', 'chart-year-line')
      .attr('x1', xScale(currentYear)).attr('x2', xScale(currentYear)).attr('y1', 0).attr('y2', h);
  }

  // ── Helper: Phase backgrounds ─────────────────────────────────────────

  function drawPhaseBackgrounds(g, xScale, h) {
    PHASES.forEach(p => {
      g.append('rect')
        .attr('x', xScale(p.start)).attr('width', xScale(p.end) - xScale(p.start))
        .attr('y', 0).attr('height', h)
        .attr('fill', p.color).attr('class', 'chart-phase-bg');
    });
  }

  return { init, updateYear };
})();
