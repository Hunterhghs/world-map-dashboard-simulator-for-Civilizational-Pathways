/**
 * Civilizational Pathways — D3 World Map
 * Choropleth map synchronized to simulation year and selected metric.
 */

const WorldMap = (() => {
  let svg, g, projection, pathGen;
  let geoData = null;
  let currentMetric = 'devIndex';
  let currentYear = 2025;
  let countryPaths = null;
  let zoom = null;
  let colorScale = null;
  let tooltip = null;

  // ── Color scales per metric ────────────────────────────────────────────

  const COLOR_SCHEMES = {
    devIndex: ['#0d1b2a', '#1b3a4b', '#1b7a5e', '#2dd4bf', '#ccfbf1'],
    population: ['#0d1b2a', '#2d1b3a', '#7a1b5e', '#f472b6', '#fce7f3'],
    wetbulbRisk: ['#0d1b2a', '#3a1b0d', '#c2410c', '#f87171', '#fecaca'],
    toxicity: ['#0d1b2a', '#3a2d0d', '#b45309', '#fb923c', '#fed7aa'],
    fossilPct: ['#0d1b2a', '#3a1b1b', '#b91c1c', '#f87171', '#fee2e2'],
    urbanPct: ['#0d1b2a', '#1b2d3a', '#1e40af', '#60a5fa', '#dbeafe']
  };

  const METRIC_LABELS = {
    devIndex: 'Development Index',
    population: 'Population (B)',
    wetbulbRisk: 'Wet-Bulb Risk',
    toxicity: 'Toxicity Load',
    fossilPct: 'Fossil Energy %',
    urbanPct: 'Urbanization %'
  };

  // ── Initialize ─────────────────────────────────────────────────────────

  async function init() {
    svg = d3.select('#map-svg');
    tooltip = d3.select('#map-tooltip');

    // Load TopoJSON
    const resp = await fetch('data/world-110m.json');
    const topo = await resp.json();
    geoData = topojson.feature(topo, topo.objects.countries);

    const container = document.querySelector('#map-container');
    const W = container.clientWidth;
    const H = container.clientHeight - 36; // minus header

    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');

    // Equirectangular projection (simple, familiar world map)
    projection = d3.geoEquirectangular()
      .fitSize([W, H], geoData);

    pathGen = d3.geoPath(projection);

    // Zoom behavior
    zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Main group
    g = svg.append('g');

    // Ocean background
    g.append('rect')
      .attr('x', -W).attr('y', -H)
      .attr('width', W * 3).attr('height', H * 3)
      .attr('fill', '#060a12');

    // Draw all countries
    countryPaths = g.selectAll('path')
      .data(geoData.features)
      .join('path')
      .attr('class', 'map-country')
      .attr('d', pathGen)
      .attr('fill', d => getCountryColor(d, currentYear))
      .on('mouseover', handleMouseOver)
      .on('mousemove', handleMouseMove)
      .on('mouseout', handleMouseOut)
      .on('click', handleClick);

    // Initial color scale
    updateColorScale();

    // Draw year label on map
    g.append('text')
      .attr('class', 'map-year-label')
      .attr('x', 20).attr('y', H - 20)
      .attr('fill', 'rgba(255,255,255,0.12)')
      .attr('font-size', '48px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('id', 'map-year-text')
      .text(currentYear);
  }

  // ── Update map on year or metric change ────────────────────────────────

  function update(year, metric) {
    if (year !== undefined) currentYear = year;
    if (metric !== undefined) {
      currentMetric = metric;
      updateColorScale();
    }
    if (!countryPaths) return;

    countryPaths
      .transition().duration(300)
      .attr('fill', d => getCountryColor(d, currentYear));

    d3.select('#map-year-text').text(currentYear);
  }

  function updateColorScale() {
    const sim = Simulation.getData();
    // Compute range for current metric
    let values = [];
    for (const region of Simulation.getRegionNames()) {
      values.push(Simulation.getRegionalValue(region, currentMetric, currentYear));
    }
    const domain = [d3.min(values) || 0, d3.max(values) || 1];
    colorScale = d3.scaleLinear()
      .domain(d3.range(domain[0], domain[1], (domain[1] - domain[0]) / 4))
      .range(COLOR_SCHEMES[currentMetric] || COLOR_SCHEMES.devIndex)
      .interpolate(d3.interpolateRgb);
  }

  // ── Country → region → value lookup ────────────────────────────────────

  const countryToRegion = Simulation.getCountryToRegion();

  function getCountryColor(feature, year) {
    const name = feature.properties?.name || '';
    const region = countryToRegion[name];
    if (!region) return '#0a1018'; // unassigned: very dark

    const value = Simulation.getRegionalValue(region, currentMetric, year);
    if (value === undefined) return '#0a1018';

    return colorScale ? colorScale(value) : '#0a1018';
  }

  function getCountryInfo(feature) {
    const name = feature.properties?.name || 'Unknown';
    const region = countryToRegion[name];
    if (!region) return { name, region: 'Unassigned', value: 0 };

    const value = Simulation.getRegionalValue(region, currentMetric, currentYear);
    const pop = Simulation.getRegionalValue(region, 'population', currentYear);
    const tfr = Simulation.getRegionalValue(region, 'tfr', currentYear);
    return { name, region, value, pop, tfr };
  }

  // ── Interaction handlers ───────────────────────────────────────────────

  function handleMouseOver(event, d) {
    const info = getCountryInfo(d);
    d3.select(event.currentTarget)
      .attr('stroke', '#f0b429')
      .attr('stroke-width', '1.5');

    tooltip.html(`
      <div class="tt-name">${info.name}</div>
      <div class="tt-stat">Region: ${info.region}</div>
      <div class="tt-stat">${METRIC_LABELS[currentMetric]}: <span>${formatMetric(info.value)}</span></div>
      <div class="tt-stat">Pop: <span>${(info.pop * 1000).toFixed(0)}M</span></div>
    `);
  }

  function handleMouseMove(event) {
    const [mx, my] = d3.pointer(event, document.body);
    tooltip
      .style('left', (mx + 16) + 'px')
      .style('top', (my - 60) + 'px')
      .classed('visible', true);
  }

  function handleMouseOut(event) {
    d3.select(event.currentTarget)
      .attr('stroke', '#080c14')
      .attr('stroke-width', '0.5');
    tooltip.classed('visible', false);
  }

  function handleClick(event, d) {
    const info = getCountryInfo(d);
    // Dispatch custom event for other panels
    window.dispatchEvent(new CustomEvent('countrySelected', {
      detail: { country: info.name, region: info.region }
    }));
  }

  // ── Format helpers ─────────────────────────────────────────────────────

  function formatMetric(value) {
    if (currentMetric === 'population') return value.toFixed(2) + 'B';
    if (currentMetric === 'devIndex' || currentMetric === 'wetbulbRisk' || currentMetric === 'toxicity' || currentMetric === 'urbanPct')
      return (value * 100).toFixed(1) + '%';
    if (currentMetric === 'fossilPct') return (value * 100).toFixed(0) + '%';
    return value.toFixed(3);
  }

  return { init, update };
})();
