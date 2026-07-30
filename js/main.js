/**
 * Civilizational Pathways — Main Orchestrator
 * Timeline control, KPI updates, map↔chart sync, play/pause animation.
 */

const App = (() => {
  let currentYear = 2025;
  let playing = false;
  let playSpeed = 100; // ms per year
  let animFrame = null;
  let timelineSvg = null;

  // ── Initialize ─────────────────────────────────────────────────────────

  async function init() {
    // Initialize simulation data
    Simulation.init();

    // Initialize map (async — loads GeoJSON)
    await WorldMap.init();

    // Initialize charts
    Charts.init();

    // Initialize timeline
    initTimeline();

    // Bind UI controls
    bindControls();

    // Set initial year
    setYear(2025);

    // Handle resize
    window.addEventListener('resize', () => {
      Charts.updateYear(currentYear);
    });
  }

  // ── Year management ────────────────────────────────────────────────────

  function setYear(year) {
    currentYear = Math.max(Simulation.START_YEAR, Math.min(Simulation.END_YEAR, Math.round(year)));
    updateAll();
  }

  function updateAll() {
    // Update KPIs
    updateKPIs();

    // Update map
    WorldMap.update(currentYear);

    // Update charts
    Charts.updateYear(currentYear);

    // Update timeline position
    updateTimelineHandle();

    // Update phase
    updatePhase();
  }

  // ── KPI Cards ──────────────────────────────────────────────────────────

  function updateKPIs() {
    const pop = Simulation.getGlobalValue('population', currentYear);
    const tfr = Simulation.getGlobalValue('tfr', currentYear);
    const sciv = Simulation.getGlobalValue('scivilization', currentYear);
    const wbRisk = Simulation.getGlobalValue('wetbulbRisk', currentYear);

    document.getElementById('kpi-year').textContent = currentYear;
    document.getElementById('kpi-pop').textContent = pop.toFixed(1) + 'B';
    document.getElementById('kpi-tfr').textContent = tfr.toFixed(2);
    document.getElementById('kpi-sciv').textContent = sciv.toFixed(3);
    document.getElementById('kpi-wb').textContent = (wbRisk * 100).toFixed(0) + '%';

    // Color-code Scivilization KPI
    const scivEl = document.getElementById('kpi-sciv');
    if (sciv >= 0.7) scivEl.style.color = '#4ade80';
    else if (sciv >= 0.45) scivEl.style.color = '#f0b429';
    else scivEl.style.color = '#f87171';

    // Color-code Wet-Bulb KPI
    const wbEl = document.getElementById('kpi-wb');
    if (wbRisk >= 0.5) wbEl.style.color = '#f87171';
    else if (wbRisk >= 0.25) wbEl.style.color = '#fb923c';
    else wbEl.style.color = '#f0b429';
  }

  // ── Phase Indicator ────────────────────────────────────────────────────

  function updatePhase() {
    const phase = Simulation.getPhaseForYear(currentYear);
    document.getElementById('phase-label').textContent = phase.name;
    document.getElementById('phase-label').style.color = phase.color;
    document.getElementById('phase-bar').style.background = phase.color;
  }

  // ── Timeline ───────────────────────────────────────────────────────────

  function initTimeline() {
    timelineSvg = d3.select('#timeline-svg');
    const track = document.querySelector('#timeline-track');
    const W = track.clientWidth;
    const H = track.clientHeight;

    timelineSvg.attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'none');

    const xScale = d3.scaleLinear()
      .domain([Simulation.START_YEAR, Simulation.END_YEAR])
      .range([0, W]);

    // Phase background bands
    const phases = [
      { s: 1900, e: 2025, c: '#4a5568', l: 'Pre-Transition' },
      { s: 2026, e: 2050, c: '#e53e3e', l: 'Phase I' },
      { s: 2051, e: 2100, c: '#dd6b20', l: 'Phase II' },
      { s: 2101, e: 2200, c: '#38a169', l: 'Phase III' },
      { s: 2201, e: 2500, c: '#3182ce', l: 'Equilibrium' }
    ];

    phases.forEach(p => {
      timelineSvg.append('rect')
        .attr('x', xScale(p.s)).attr('y', 0)
        .attr('width', xScale(p.e) - xScale(p.s)).attr('height', H)
        .attr('fill', p.c).attr('opacity', 0.25);

      // Label
      const midX = (xScale(p.s) + xScale(p.e)) / 2;
      timelineSvg.append('text')
        .attr('x', midX).attr('y', H / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', p.c)
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'Inter, sans-serif')
        .attr('opacity', 0.9)
        .text(p.l);
    });

    // Tick marks at century boundaries
    for (let y = 1900; y <= 2500; y += 100) {
      timelineSvg.append('line')
        .attr('x1', xScale(y)).attr('x2', xScale(y))
        .attr('y1', 0).attr('y2', 8)
        .attr('stroke', '#64748b').attr('stroke-width', 1);
      timelineSvg.append('text')
        .attr('x', xScale(y)).attr('y', H - 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(y);
    }

    // Year handle
    timelineSvg.append('line')
      .attr('id', 'tl-handle-line')
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#f0b429').attr('stroke-width', 2);

    timelineSvg.append('circle')
      .attr('id', 'tl-handle-dot')
      .attr('r', 6)
      .attr('fill', '#f0b429')
      .attr('stroke', '#080c14')
      .attr('stroke-width', 2);

    // Click to jump
    timelineSvg.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', W).attr('height', H)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', (event) => {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        setYear(year);
      });

    // Store xScale for later use
    timelineSvg._xScale = xScale;
    timelineSvg._W = W;
  }

  function updateTimelineHandle() {
    if (!timelineSvg || !timelineSvg._xScale) return;
    const xScale = timelineSvg._xScale;
    const x = xScale(currentYear);

    timelineSvg.select('#tl-handle-line')
      .attr('x1', x).attr('x2', x);
    timelineSvg.select('#tl-handle-dot')
      .attr('cx', x).attr('cy', timelineSvg._W ? 8 : 8);
  }

  // ── Controls ───────────────────────────────────────────────────────────

  function bindControls() {
    // Play/Pause
    document.getElementById('tl-play').addEventListener('click', togglePlay);

    // Step buttons
    document.getElementById('tl-step-back-100').addEventListener('click', () => setYear(currentYear - 100));
    document.getElementById('tl-step-back-10').addEventListener('click', () => setYear(currentYear - 10));
    document.getElementById('tl-step-fwd-10').addEventListener('click', () => setYear(currentYear + 10));
    document.getElementById('tl-step-fwd-100').addEventListener('click', () => setYear(currentYear + 100));

    // Speed
    document.getElementById('tl-speed').addEventListener('change', (e) => {
      playSpeed = parseInt(e.target.value);
    });

    // Metric buttons
    document.querySelectorAll('.metric-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const metric = btn.dataset.metric;
        WorldMap.update(currentYear, metric);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': setYear(currentYear - (e.shiftKey ? 100 : 10)); break;
        case 'ArrowRight': setYear(currentYear + (e.shiftKey ? 100 : 10)); break;
        case 'ArrowUp': setYear(currentYear + 1); break;
        case 'ArrowDown': setYear(currentYear - 1); break;
        case 'Home': setYear(1900); break;
        case 'End': setYear(2500); break;
      }
    });
  }

  // ── Play/Pause Animation ──────────────────────────────────────────────

  function togglePlay() {
    playing = !playing;
    const btn = document.getElementById('tl-play');
    if (playing) {
      btn.textContent = '⏸';
      btn.classList.add('paused');
      animate();
    } else {
      btn.textContent = '▶';
      btn.classList.remove('paused');
      if (animFrame) cancelAnimationFrame(animFrame);
    }
  }

  function animate() {
    if (!playing) return;

    setYear(currentYear + 1);

    if (currentYear >= Simulation.END_YEAR) {
      playing = false;
      document.getElementById('tl-play').textContent = '▶';
      document.getElementById('tl-play').classList.remove('paused');
      return;
    }

    animFrame = setTimeout(() => {
      requestAnimationFrame(animate);
    }, playSpeed);
  }

  return { init, setYear };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
