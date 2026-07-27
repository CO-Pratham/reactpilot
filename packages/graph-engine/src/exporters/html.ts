import type { GraphData } from '../types.js';

/**
 * Generate a self-contained interactive HTML file utilizing D3.js force layout.
 * Includes search, filter sidebar, node details, and dark/light modes.
 */
export function exportToHtml(graph: GraphData, theme: 'dark' | 'light' = 'dark'): string {
  const jsonGraph = JSON.stringify(graph);

  return `<!DOCTYPE html>
<html lang="en" class="${theme}">
<head>
  <meta charset="UTF-8">
  <title>ReactPilot Visual Architecture Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    :root {
      --bg: #0F172A;
      --panel-bg: rgba(30, 41, 59, 0.85);
      --text: #F8FAFC;
      --border: #334155;
      --accent: #8B5CF6;
    }
    html.light {
      --bg: #F8FAFC;
      --panel-bg: rgba(255, 255, 255, 0.9);
      --text: #0F172A;
      --border: #CBD5E1;
      --accent: #6D28D9;
    }

    body {
      margin: 0;
      overflow: hidden;
      background-color: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    #graph-container {
      width: 100vw;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
    }

    /* Sidebar controls */
    .panel {
      position: absolute;
      top: 20px;
      left: 20px;
      background: var(--panel-bg);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      width: 280px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }

    .panel h2 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 700;
    }

    .form-group {
      margin-bottom: 12px;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      opacity: 0.8;
    }

    input, select {
      width: 100%;
      background: rgba(0,0,0,0.1);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 6px;
      box-sizing: border-box;
      outline: none;
    }

    /* Legend */
    .legend {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      font-size: 11px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
    }

    /* Details panel */
    #details-panel {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 320px;
      display: none;
    }

    .theme-toggle {
      position: absolute;
      top: 20px;
      right: 20px;
      background: var(--panel-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      z-index: 10;
    }

    /* Interactive Graph Elements styling */
    .link-normal {
      stroke: #475569;
      stroke-opacity: 0.45;
    }
    html.light .link-normal {
      stroke: #94A3B8;
      stroke-opacity: 0.65;
    }
    .link-circular {
      stroke: #EF4444;
      stroke-opacity: 0.9;
    }

    .node-circle {
      stroke: #1E293B;
      stroke-width: 1.5px;
    }
    html.light .node-circle {
      stroke: #FFFFFF;
    }

    .node-text {
      font-size: 11px;
      font-weight: 500;
      fill: #E2E8F0;
      pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }
    html.light .node-text {
      fill: #1E293B;
      text-shadow: 0 1px 2px rgba(255,255,255,0.8);
    }
  </style>
</head>
<body>

  <button class="theme-toggle" onclick="toggleTheme()">🌓 Theme</button>

  <div class="panel">
    <h2>ReactPilot Graph</h2>
    <div class="form-group">
      <label for="search">Search Node</label>
      <input type="text" id="search" placeholder="Type name..." oninput="searchNodes()">
    </div>
    <div class="form-group">
      <label for="filter-type">Filter by Type</label>
      <select id="filter-type" onchange="filterNodes()">
        <option value="all">All Types</option>
        <option value="page">Pages / Routes</option>
        <option value="component">Components</option>
        <option value="hook">Hooks</option>
        <option value="context">Contexts</option>
        <option value="utility">Utilities</option>
      </select>
    </div>

    <div class="legend">
      <div class="legend-item"><div class="legend-color" style="background:#10B981"></div>Page / Route</div>
      <div class="legend-item"><div class="legend-color" style="background:#3B82F6"></div>Component</div>
      <div class="legend-item"><div class="legend-color" style="background:#F59E0B"></div>Hook</div>
      <div class="legend-item"><div class="legend-color" style="background:#8B5CF6"></div>Context</div>
      <div class="legend-item"><div class="legend-color" style="background:#EF4444"></div>Circular Loop</div>
      <div class="legend-item"><div class="legend-color" style="background:#64748B"></div>Unused Component</div>
    </div>
  </div>

  <div id="details-panel" class="panel">
    <h3 id="details-title" style="margin:0 0 8px 0; font-size:14px;">Node Detail</h3>
    <p id="details-type" style="margin:4px 0; font-size:12px; opacity:0.8;"></p>
    <p id="details-size" style="margin:4px 0; font-size:12px; opacity:0.8;"></p>
    <h4 style="margin:12px 0 4px 0; font-size:12px;">Imports:</h4>
    <ul id="details-imports" style="margin:0; padding-left:16px; font-size:11px; max-height:100px; overflow-y:auto;"></ul>
  </div>

  <svg id="graph-container"></svg>

  <script>
    const data = ${jsonGraph};

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("#graph-container")
      .attr("width", width)
      .attr("height", height);

    const container = svg.append("g");

    // Add zoom capabilities
    svg.call(d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      }));

    // Setup force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Draw Edges
    const link = container.append("g")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("class", d => d.isCircular ? "link-circular" : "link-normal")
      .attr("stroke-width", d => d.isCircular ? 2.5 : 1);

    // Draw Nodes
    const node = container.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", showDetails);

    node.append("circle")
      .attr("r", d => Math.max(8, Math.min(20, Math.sqrt(d.size / 100) + 4)))
      .attr("fill", d => {
        if (d.isCircular) return "#EF4444";
        if (d.isUnused) return "#64748B";
        if (d.type === 'page') return "#10B981";
        if (d.type === 'hook') return "#F59E0B";
        if (d.type === 'context') return "#8B5CF6";
        return "#3B82F6";
      })
      .attr("class", "node-circle");

    node.append("text")
      .attr("x", 12)
      .attr("y", 3)
      .text(d => d.label)
      .attr("class", "node-text");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => \`translate(\${d.x},\${d.y})\`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function showDetails(event, d) {
      const panel = document.getElementById("details-panel");
      panel.style.display = "block";
      document.getElementById("details-title").textContent = d.label;
      document.getElementById("details-type").textContent = "Type: " + d.type;
      document.getElementById("details-size").textContent = "Size: " + (d.size / 1024).toFixed(2) + " KB";

      const importsList = document.getElementById("details-imports");
      importsList.innerHTML = "";
      d.dependencies.forEach(dep => {
        const li = document.createElement("li");
        li.textContent = dep;
        importsList.appendChild(li);
      });
    }

    function searchNodes() {
      const q = document.getElementById("search").value.toLowerCase();
      node.style("opacity", d => d.label.toLowerCase().includes(q) ? 1 : 0.15);
      link.style("opacity", d => d.source.label.toLowerCase().includes(q) && d.target.label.toLowerCase().includes(q) ? 0.6 : 0.05);
    }

    function filterNodes() {
      const type = document.getElementById("filter-type").value;
      if (type === "all") {
        node.style("display", null);
        link.style("display", null);
      } else {
        node.style("display", d => d.type === type ? null : "none");
        link.style("display", d => d.source.type === type && d.target.type === type ? null : "none");
      }
    }

    function toggleTheme() {
      const html = document.documentElement;
      html.classList.toggle("light");
    }
  </script>
</body>
</html>`;
}
