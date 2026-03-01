// app.js - Structural Analysis Web App (FIXED)

// ===== DATA STORAGE =====
let beamNodes = [];
let beamLoads = [];
let beamSpanMultipliers = {};

let frameNodes = [];
let frameMembers = [];
let frameLoads = [];

function numberToLetter(num) {
    return String.fromCharCode(65 + num);
}

function letterToNumber(letter) {
    return letter.toUpperCase().charCodeAt(0) - 65;
}

// ===== COLLAPSIBLE SECTIONS =====
function toggleSection(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
}

// ===== TAB SWITCHING =====
function switchMainTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + '-content').classList.add('active');
    if (tab === 'beam') {
        updateVisualization();
    } else {
        updateFrameVisualization();
    }
}

// ===== BEAM ANALYSIS =====

function clearAllBeam() {
    if (confirm('Are you sure you want to clear all beam data?')) {
        beamNodes = [];
        beamLoads = [];
        beamSpanMultipliers = {};
        document.getElementById('node-x').value = '';
        document.getElementById('load-mag').value = '';
        document.getElementById('load-start').value = '';
        updateNodesList();
        updateSpanMultipliersList();
        updateLoadsList();
        updateVisualization();
        document.getElementById('beam-results').innerHTML = '';
    }
}

function addNode() {
    const x = parseFloat(document.getElementById('node-x').value);
    const type = document.getElementById('node-type').value;
    if (isNaN(x)) { alert('Please enter a valid position'); return; }
    if (beamNodes.some(n => Math.abs(n.x - x) < 0.01)) { alert('Node already exists at this position'); return; }
    beamNodes.push({ id: beamNodes.length, x: x, type: type });
    beamNodes.sort((a, b) => a.x - b.x);
    beamNodes.forEach((n, i) => n.id = i);
    updateNodesList();
    updateSpanMultipliersList();
    updateVisualization();
    document.getElementById('node-x').value = '';
}

function updateNodesList() {
    const list = document.getElementById('nodes-list');
    list.innerHTML = beamNodes.map((n, i) => `
        <div class="item">
            <span><strong>${numberToLetter(i)}</strong>: x = ${n.x}m (${n.type})</span>
            <button onclick="removeNode(${i})">Remove</button>
        </div>
    `).join('');
}

function removeNode(index) {
    beamNodes.splice(index, 1);
    beamNodes.forEach((n, i) => n.id = i);
    updateNodesList();
    updateSpanMultipliersList();
    updateVisualization();
}

function updateSpanMultipliersList() {
    const list = document.getElementById('span-multipliers-list');
    if (beamNodes.length < 2) {
        list.innerHTML = '<p style="color: #999; font-size: 12px;">Add at least 2 nodes to define spans</p>';
        return;
    }
    let html = '';
    for (let i = 0; i < beamNodes.length - 1; i++) {
        const spanKey = `${i}`;
        const currentValue = beamSpanMultipliers[spanKey] || 1.0;
        html += `
            <div class="item">
                <span>Span ${numberToLetter(i)}-${numberToLetter(i+1)} (${beamNodes[i].x}m to ${beamNodes[i+1].x}m)</span>
                <input type="number" value="${currentValue}" step="0.1"
                       style="width: 80px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
                       onchange="beamSpanMultipliers['${spanKey}'] = parseFloat(this.value); updateVisualization()">
            </div>
        `;
    }
    list.innerHTML = html;
}

function updateLoadInputs() {
    const loadType = document.getElementById('load-type').value;
    const container = document.getElementById('load-inputs');
    if (loadType === 'Point') {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Magnitude (kN)</label>
                    <input type="number" id="load-mag" step="0.1" placeholder="10">
                </div>
                <div class="form-group">
                    <label>Position (m)</label>
                    <input type="number" id="load-start" step="0.1" placeholder="2.5">
                </div>
            </div>
        `;
    } else if (loadType === 'UDL') {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Intensity (kN/m)</label>
                    <input type="number" id="load-mag" step="0.1" placeholder="10">
                </div>
                <div class="form-group">
                    <label>Start (m)</label>
                    <input type="number" id="load-start" step="0.1" placeholder="0">
                </div>
            </div>
            <div class="form-group">
                <label>End (m)</label>
                <input type="number" id="load-end" step="0.1" placeholder="5">
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Start Intensity (kN/m)</label>
                    <input type="number" id="load-mag" step="0.1" placeholder="0">
                </div>
                <div class="form-group">
                    <label>End Intensity (kN/m)</label>
                    <input type="number" id="load-mag-end" step="0.1" placeholder="24">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Position (m)</label>
                    <input type="number" id="load-start" step="0.1" placeholder="0">
                </div>
                <div class="form-group">
                    <label>End Position (m)</label>
                    <input type="number" id="load-end" step="0.1" placeholder="4">
                </div>
            </div>
        `;
    }
}

function addLoad() {
    const type = document.getElementById('load-type').value;
    const mag = parseFloat(document.getElementById('load-mag').value);
    const start = parseFloat(document.getElementById('load-start').value);
    if (isNaN(mag) || isNaN(start)) { alert('Please enter valid values'); return; }
    const load = { type: type, mag: mag, start: start };
    if (type === 'UDL' || type === 'VDL') {
        const end = parseFloat(document.getElementById('load-end').value);
        if (isNaN(end)) { alert('Please enter end position'); return; }
        load.end = end;
    }
    if (type === 'VDL') {
        const magEnd = parseFloat(document.getElementById('load-mag-end').value);
        if (isNaN(magEnd)) { alert('Please enter end intensity'); return; }
        load.mag_end = magEnd;
    }
    beamLoads.push(load);
    updateLoadsList();
    updateVisualization();
    document.getElementById('load-mag').value = '';
    document.getElementById('load-start').value = '';
    if (document.getElementById('load-end')) document.getElementById('load-end').value = '';
    if (document.getElementById('load-mag-end')) document.getElementById('load-mag-end').value = '';
}

function updateLoadsList() {
    const list = document.getElementById('loads-list');
    list.innerHTML = beamLoads.map((l, i) => {
        let desc = '';
        if (l.type === 'Point') {
            desc = `Point: ${l.mag} kN at ${l.start}m`;
        } else if (l.type === 'UDL') {
            desc = `UDL: ${l.mag} kN/m from ${l.start}m to ${l.end}m`;
        } else {
            desc = `VDL: ${l.mag}→${l.mag_end} kN/m from ${l.start}m to ${l.end}m`;
        }
        return `
            <div class="item">
                <span>${desc}</span>
                <button onclick="removeLoad(${i})">Remove</button>
            </div>
        `;
    }).join('');
}

function removeLoad(index) {
    beamLoads.splice(index, 1);
    updateLoadsList();
    updateVisualization();
}

function updateVisualization() {
    const canvas = document.getElementById('structure-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 380;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (beamNodes.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Add nodes to visualize structure', canvas.width / 2, canvas.height / 2);
        return;
    }
    const minX = Math.min(...beamNodes.map(n => n.x));
    const maxX = Math.max(...beamNodes.map(n => n.x));
    const spanLength = maxX - minX;
    const padding = 80;
    const scale = (canvas.width - 2 * padding) / (spanLength || 1);
    const beamY = canvas.height / 2;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(padding + (beamNodes[0].x - minX) * scale, beamY);
    for (let i = 1; i < beamNodes.length; i++) {
        ctx.lineTo(padding + (beamNodes[i].x - minX) * scale, beamY);
    }
    ctx.stroke();
    beamNodes.forEach((node, index) => {
        const x = padding + (node.x - minX) * scale;
        ctx.save();
        ctx.translate(x, beamY);
        if (node.type === 'fixed') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-15, 0, 30, 8);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let i = -15; i < 15; i += 5) {
                ctx.beginPath(); ctx.moveTo(i, 8); ctx.lineTo(i + 5, 15); ctx.stroke();
            }
        } else if (node.type === 'pinned') {
            ctx.fillStyle = '#4169E1';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-12, 18); ctx.lineTo(12, 18);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        } else if (node.type === 'roller') {
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-12, 18); ctx.lineTo(12, 18);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(-6, 22, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(6, 22, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(numberToLetter(index), 0, -20);
        ctx.font = '11px Arial';
        ctx.fillText(`${node.x}m`, 0, -8);
        ctx.restore();
    });
    beamLoads.forEach(load => {
        if (load.type === 'Point') {
            const x = padding + (load.start - minX) * scale;
            ctx.strokeStyle = '#e74c3c'; ctx.fillStyle = '#e74c3c'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, beamY - 60); ctx.lineTo(x, beamY - 10); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, beamY - 10); ctx.lineTo(x - 5, beamY - 20); ctx.lineTo(x + 5, beamY - 20);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`${load.mag} kN`, x, beamY - 65);
        } else if (load.type === 'UDL') {
            const x1 = padding + (load.start - minX) * scale;
            const x2 = padding + (load.end - minX) * scale;
            ctx.strokeStyle = '#3498db'; ctx.fillStyle = '#3498db'; ctx.lineWidth = 2;
            const numArrows = Math.max(3, Math.floor((x2 - x1) / 30));
            for (let i = 0; i <= numArrows; i++) {
                const x = x1 + (x2 - x1) * i / numArrows;
                ctx.beginPath(); ctx.moveTo(x, beamY - 50); ctx.lineTo(x, beamY - 10); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, beamY - 10); ctx.lineTo(x - 3, beamY - 16); ctx.lineTo(x + 3, beamY - 16);
                ctx.closePath(); ctx.fill();
            }
            ctx.beginPath(); ctx.moveTo(x1, beamY - 50); ctx.lineTo(x2, beamY - 50); ctx.stroke();
            ctx.fillStyle = '#000'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`${load.mag} kN/m`, (x1 + x2) / 2, beamY - 55);
        } else if (load.type === 'VDL') {
            const x1 = padding + (load.start - minX) * scale;
            const x2 = padding + (load.end - minX) * scale;
            ctx.strokeStyle = '#9b59b6'; ctx.fillStyle = '#9b59b6'; ctx.lineWidth = 2;
            const h1 = 10 + load.mag * 3;
            const h2 = 10 + load.mag_end * 3;
            ctx.beginPath();
            ctx.moveTo(x1, beamY - 10); ctx.lineTo(x1, beamY - h1);
            ctx.lineTo(x2, beamY - h2); ctx.lineTo(x2, beamY - 10); ctx.stroke();
            ctx.fillStyle = 'rgba(155, 89, 182, 0.2)'; ctx.fill();
            ctx.strokeStyle = '#9b59b6'; ctx.fillStyle = '#9b59b6';
            const numArrows = Math.max(3, Math.floor((x2 - x1) / 30));
            for (let i = 0; i <= numArrows; i++) {
                const x = x1 + (x2 - x1) * i / numArrows;
                const h = h1 + (h2 - h1) * i / numArrows;
                ctx.beginPath(); ctx.moveTo(x, beamY - h); ctx.lineTo(x, beamY - 10); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, beamY - 10); ctx.lineTo(x - 3, beamY - 16); ctx.lineTo(x + 3, beamY - 16);
                ctx.closePath(); ctx.fill();
            }
            ctx.fillStyle = '#000'; ctx.font = '11px Arial';
            ctx.textAlign = 'left'; ctx.fillText(`${load.mag}`, x1 + 5, beamY - h1 - 5);
            ctx.textAlign = 'right'; ctx.fillText(`${load.mag_end} kN/m`, x2 - 5, beamY - h2 - 5);
        }
    });
}

async function analyzeBeam() {
    if (beamNodes.length < 2) { alert('Please add at least 2 nodes'); return; }
    document.getElementById('beam-loading').classList.add('active');
    document.getElementById('beam-results').innerHTML = '';
    try {
        const elements = [];
        const E = parseFloat(document.getElementById('beam-E').value) * 1e9;
        const I_base = parseFloat(document.getElementById('beam-I').value) * 1e-6;
        for (let i = 0; i < beamNodes.length - 1; i++) {
            const multiplier = beamSpanMultipliers[`${i}`] || 1.0;
            elements.push({ node_i: i, node_j: i + 1, E: E, I: I_base * multiplier });
        }
        const response = await fetch('/api/beam/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes: beamNodes, elements: elements, loads: beamLoads })
        });
        const data = await response.json();
        if (data.success) {
            const barDia = parseFloat(document.getElementById('design-bar-dia').value) || 16;
            const maxShear = Math.max(...(data.shears || []).map(s => Math.max(Math.abs(s.v_i), Math.abs(s.v_j))));
            const designParams = {
                max_moment: data.max_sagging || data.max_moment,
                min_moment: data.max_hogging || 0,
                max_shear: maxShear || 0,
                material: document.getElementById('design-material').value,
                width: parseFloat(document.getElementById('design-width').value),
                fck: parseFloat(document.getElementById('design-fck').value),
                fy: parseFloat(document.getElementById('design-fy').value),
                cover: parseFloat(document.getElementById('design-cover').value),
                bar_dia: barDia,
                L_max: Math.max(...elements.map(e => beamNodes[e.node_j].x - beamNodes[e.node_i].x)),
                design_code: document.getElementById('design-code').value
            };
            const designResponse = await fetch('/api/design/beam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(designParams)
            });
            const designData = await designResponse.json();
            displayBeamResults(data, designData, barDia);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        document.getElementById('beam-results').innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><small>Make sure the API server is running: python api_server_final.py</small>
            </div>
        `;
    } finally {
        document.getElementById('beam-loading').classList.remove('active');
    }
}

function displayBeamResults(data, designData, barDia) {
    let html = '';

    // ════════════════════════════════════════════════════════════════════════
    // BS 8110 DESIGN CARDS
    // ════════════════════════════════════════════════════════════════════════
    if (designData && designData.success) {
        const PASS = '#16a34a', FAIL = '#dc2626', WARN = '#d97706';
        const BG   = '#0d1117', PANEL = '#161b22', BORDER = '#30363d';
        const TXT  = '#e6edf3', MUTED = '#8b949e', BLUE  = '#58a6ff';

        const sec  = designData.section || {};
        const bot  = designData.bottom  || {};
        const top  = designData.top     || {};
        const shr  = designData.shear   || {};
        const sls  = designData.sls     || {};
        const uls  = designData.uls     || {};

        const b_mm  = sec.b    || 225;
        const h_mm  = sec.h    || Math.round(uls.depth || 450);
        const d_eff = sec.d_eff|| Math.round(uls.eff_depth || h_mm - 60);
        const fcu   = sec.fcu  || parseFloat(document.getElementById('design-fck').value) || 25;
        const fy    = sec.fy   || parseFloat(document.getElementById('design-fy').value) || 460;
        const fyv   = sec.fyv  || 250;
        const cov   = sec.cover|| parseFloat(document.getElementById('design-cover').value) || 25;
        const code  = designData.code || 'BS 8110:1997';

        // ── Header banner
        html += `
        <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;
                    padding:14px 18px;margin-bottom:16px;font-family:monospace;">
            <div style="color:${BLUE};font-size:0.92rem;font-weight:700;letter-spacing:0.05em;
                        margin-bottom:6px;">${code}</div>
            <div style="color:${MUTED};font-size:0.72rem;margin-bottom:10px;">
                Nigerian standard per NIStructE / COREN &nbsp;&middot;&nbsp;
                &gamma;m = 1.5 (concrete) &nbsp;&middot;&nbsp; &gamma;s = 1.05 (steel)
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:18px;font-size:0.78rem;color:${TXT};">
                <span><span style="color:${MUTED};">Section </span><b>${b_mm}&times;${h_mm} mm</b></span>
                <span><span style="color:${MUTED};">d_eff </span><b>${d_eff} mm</b></span>
                <span><span style="color:${MUTED};">Cover </span><b>${cov} mm</b></span>
                <span><span style="color:${MUTED};">fcu </span><b>${fcu} MPa</b></span>
                <span><span style="color:${MUTED};">fy </span><b>${fy} MPa</b></span>
                <span><span style="color:${MUTED};">fyv </span><b>${fyv} MPa (R-links)</b></span>
            </div>
        </div>`;

        // ── Face card renderer
        function faceCard(face, label, icon, accentColor, labelFull) {
            if (!face || Object.keys(face).length === 0) return '';
            const M_d    = (face.M_design || 0).toFixed(3);
            const K      = (face.K || 0).toFixed(4);
            const K_lim  = (face.K_lim || 0.156).toFixed(3);
            const z      = (face.z || 0).toFixed(1);
            const As_req = Math.round(face.As_req || 0);
            const As_prov= Math.round(face.As_prov || 0);
            const Mu_cap = (face.Mu_cap || 0).toFixed(2);
            const util   = Math.min((face.util || 0), 9.99);
            const utilPct= Math.min(util * 100, 100);
            const utilColor = utilPct < 70 ? PASS : utilPct < 90 ? WARN : FAIL;
            const status = face.status || 'OK';
            const statusOk = status === 'OK' || status === 'MIN_STEEL';
            const K_ok   = parseFloat(K) <= parseFloat(K_lim);
            const bars   = face.bar_options || [];

            let out = `
            <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;
                        padding:16px;margin-bottom:14px;">
                <div style="color:${accentColor};font-family:monospace;font-size:0.82rem;
                            font-weight:700;margin-bottom:12px;">${icon} ${label}
                    <span style="font-weight:400;color:${MUTED};font-size:0.7rem;margin-left:8px;">(${labelFull})</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px;">
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">M design</div>
                         <div style="font-size:1.1rem;font-weight:700;color:${TXT};">${M_d}<span style="font-size:0.65rem;color:${MUTED}"> kNm</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">As,req</div>
                         <div style="font-size:1.1rem;font-weight:700;color:${accentColor};">${As_req}<span style="font-size:0.65rem;color:${MUTED}"> mm&sup2;</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">As,prov</div>
                         <div style="font-size:1.1rem;font-weight:700;color:${TXT};">${As_prov}<span style="font-size:0.65rem;color:${MUTED}"> mm&sup2;</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">Mu,cap</div>
                         <div style="font-size:1.1rem;font-weight:700;color:${TXT};">${Mu_cap}<span style="font-size:0.65rem;color:${MUTED}"> kNm</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">Util.</div>
                         <div style="font-size:1.1rem;font-weight:700;color:${utilColor};">${utilPct.toFixed(1)}<span style="font-size:0.65rem"> %</span></div></div>
                </div>
                <div style="background:#1e293b;border-radius:4px;height:8px;overflow:hidden;margin-bottom:10px;">
                    <div style="width:${utilPct.toFixed(1)}%;background:${utilColor};height:100%;border-radius:4px;"></div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:0.76rem;color:${TXT};margin-bottom:12px;">
                    <tr style="border-bottom:1px solid ${BORDER};">
                        <td style="padding:5px 0;color:${MUTED};">K = M/(fcu&middot;b&middot;d&sup2;)</td>
                        <td style="text-align:right;font-family:monospace;font-weight:700;color:${K_ok?PASS:FAIL};">
                            ${K} ${K_ok?'&le;':'>'} K'=${K_lim} ${K_ok?'&check;':'&cross;'}
                        </td>
                    </tr>
                    <tr style="border-bottom:1px solid ${BORDER};">
                        <td style="padding:5px 0;color:${MUTED};">Section type</td>
                        <td style="text-align:right;font-weight:600;">${face.section_type || 'Singly Reinforced'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid ${BORDER};">
                        <td style="padding:5px 0;color:${MUTED};">Lever arm z</td>
                        <td style="text-align:right;font-family:monospace;">${z} mm</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;color:${MUTED};">Status</td>
                        <td style="text-align:right;font-weight:700;color:${statusOk?PASS:FAIL};">
                            ${statusOk?'&check;':'&cross;'} ${status}
                        </td>
                    </tr>
                </table>`;
            if (bars.length > 0) {
                out += `
                <div style="color:${BLUE};font-family:monospace;font-size:0.7rem;margin-bottom:5px;">
                    Bar options (min Y16 &mdash; Nigerian norm):
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:0.74rem;color:${TXT};">
                    <thead><tr style="background:#21262d;">
                        <th style="padding:5px 8px;text-align:left;color:${BLUE};border-bottom:1px solid ${BORDER};">Bars</th>
                        <th style="padding:5px 8px;text-align:right;color:${BLUE};border-bottom:1px solid ${BORDER};">As prov (mm&sup2;)</th>
                        <th style="padding:5px 8px;text-align:right;color:${BLUE};border-bottom:1px solid ${BORDER};">Excess (mm&sup2;)</th>
                    </tr></thead><tbody>`;
                bars.forEach((b_opt, idx) => {
                    out += `<tr style="border-bottom:1px solid ${idx<bars.length-1?'#21262d':'transparent'};">
                        <td style="padding:5px 8px;font-weight:700;color:${accentColor};font-family:monospace;">${b_opt.label}</td>
                        <td style="padding:5px 8px;text-align:right;font-family:monospace;">${b_opt.area}</td>
                        <td style="padding:5px 8px;text-align:right;font-family:monospace;color:${MUTED};">+${b_opt.excess}</td>
                    </tr>`;
                });
                out += `</tbody></table>`;
            }
            out += `</div>`;
            return out;
        }

        const hasNewFormat = designData.bottom && designData.top;
        if (hasNewFormat) {
            html += faceCard(bot, 'BOTTOM STEEL', '&#9660;', '#3fb950', 'Sagging / positive moment');
            html += faceCard(top, 'TOP STEEL',    '&#9650;', '#f47067', 'Hogging / negative moment');
        } else {
            const legacyFace = {
                M_design: data.max_moment || 0, K: uls.K_actual || 0,
                K_lim: uls.K_limit || 0.156, z: d_eff * 0.9,
                As_req: uls.steel_area_req || 0, As_prov: uls.steel_area_prov || 0,
                Mu_cap: uls.moment_capacity || 0,
                util: (uls.utilization || 0) / 100, status: 'OK',
                section_type: uls.section_type || 'Singly Reinforced',
                bar_options: designData.bar_options || [],
            };
            html += faceCard(legacyFace, 'BOTTOM STEEL', '&#9660;', '#3fb950', 'Sagging');
        }

        // ── Shear
        const shearData = hasNewFormat ? shr : {
            v: uls.shear_stress_actual, vc: uls.shear_stress_allow,
            v_max: 5.0, vc_kN: 0, status: uls.shear_check || '',
            util: uls.shear_util || 0, link_options: uls.link_options || [],
            V_design: 0, sv_max: uls.sv_max || 0
        };
        if (shearData && shearData.v !== undefined) {
            const v_v    = (shearData.v   || 0).toFixed(3);
            const vc_v   = (shearData.vc  || 0).toFixed(3);
            const vmax_v = (shearData.v_max || 5).toFixed(3);
            const vc_kN  = (shearData.vc_kN || 0).toFixed(1);
            const sUtil  = Math.min(shearData.util || 0, 100);
            const st     = shearData.status || '';
            const shOk   = st.toLowerCase().includes('nominal') || st.toLowerCase().includes('min');
            const shColor = shOk ? PASS : WARN;
            const links   = shearData.link_options || [];

            html += `
            <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;padding:16px;margin-bottom:14px;">
                <div style="color:#d29922;font-family:monospace;font-size:0.82rem;font-weight:700;margin-bottom:12px;">
                    &#9889; SHEAR DESIGN
                    <span style="font-weight:400;color:${MUTED};font-size:0.7rem;margin-left:8px;">(BS 8110 Cl.3.4.5)</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;">
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">V design</div>
                         <div style="font-size:1rem;font-weight:700;color:${TXT};">${(shearData.V_design||0).toFixed(2)}<span style="font-size:0.65rem;color:${MUTED}"> kN</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">v = V/(b&middot;d)</div>
                         <div style="font-size:1rem;font-weight:700;color:${TXT};">${v_v}<span style="font-size:0.65rem;color:${MUTED}"> N/mm&sup2;</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">vc (concrete)</div>
                         <div style="font-size:1rem;font-weight:700;color:${TXT};">${vc_v}<span style="font-size:0.65rem;color:${MUTED}"> N/mm&sup2; (${vc_kN}kN)</span></div></div>
                    <div><div style="color:${MUTED};font-size:0.68rem;margin-bottom:2px;">v,max (0.8&radic;fcu)</div>
                         <div style="font-size:1rem;font-weight:700;color:${TXT};">${vmax_v}<span style="font-size:0.65rem;color:${MUTED}"> N/mm&sup2;</span></div></div>
                </div>
                <div style="background:#1e293b;border-radius:4px;height:8px;overflow:hidden;margin-bottom:6px;">
                    <div style="width:${sUtil.toFixed(1)}%;background:${shColor};height:100%;border-radius:4px;"></div>
                </div>
                <div style="font-size:0.7rem;color:${MUTED};margin-bottom:${links.length?'10px':'0'};">
                    v/vc = ${sUtil.toFixed(1)}% &nbsp;&middot;&nbsp;
                    <span style="color:${shColor};font-weight:700;">${st}</span>
                </div>`;

            if (links.length > 0) {
                html += `
                <div style="color:${BLUE};font-family:monospace;font-size:0.7rem;margin-bottom:5px;">
                    Link options (R-bars, 2-leg) &nbsp;&middot;&nbsp; sv,max = ${(shearData.sv_max||0).toFixed(0)} mm (= 0.75d)
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:0.74rem;color:${TXT};">
                    <thead><tr style="background:#21262d;">
                        <th style="padding:5px 8px;text-align:left;color:${BLUE};border-bottom:1px solid ${BORDER};">Size@sv</th>
                        <th style="padding:5px 8px;text-align:right;color:${BLUE};border-bottom:1px solid ${BORDER};">Asv (mm&sup2;)</th>
                        <th style="padding:5px 8px;text-align:right;color:${BLUE};border-bottom:1px solid ${BORDER};">sv (mm)</th>
                        <th style="padding:5px 8px;text-align:right;color:${BLUE};border-bottom:1px solid ${BORDER};">v prov</th>
                    </tr></thead><tbody>`;
                links.forEach((lk, idx) => {
                    html += `<tr style="border-bottom:1px solid ${idx<links.length-1?'#21262d':'transparent'};">
                        <td style="padding:5px 8px;font-weight:700;color:#d29922;font-family:monospace;">${lk.label}</td>
                        <td style="padding:5px 8px;text-align:right;font-family:monospace;">${lk.Av}</td>
                        <td style="padding:5px 8px;text-align:right;font-family:monospace;">${lk.sv}</td>
                        <td style="padding:5px 8px;text-align:right;font-family:monospace;">${lk.v_prov}</td>
                    </tr>`;
                });
                html += `</tbody></table>`;
            }
            html += `</div>`;
        }

        // ── SLS checks
        if (sls && sls.deflection_check) {
            const defOk = sls.deflection_check === 'OK';
            const crOk  = sls.crack_check === 'OK';
            html += `
            <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:10px;padding:16px;margin-bottom:14px;">
                <div style="color:${MUTED};font-family:monospace;font-size:0.82rem;font-weight:700;margin-bottom:12px;">
                    SLS CHECKS <span style="font-weight:400;font-size:0.7rem;margin-left:8px;">(Serviceability)</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="padding:12px;background:${defOk?'#052e16':'#450a0a'};border-radius:8px;border-left:4px solid ${defOk?PASS:FAIL};">
                        <div style="font-weight:700;color:${defOk?PASS:FAIL};margin-bottom:6px;font-family:monospace;font-size:0.78rem;">
                            Deflection: ${defOk?'&#10003; OK':'&#10007; FAIL'}
                        </div>
                        <div style="font-size:0.75rem;color:${TXT};">
                            span/d = <b>${(sls.span_depth_actual||0).toFixed(1)}</b> (limit ${(sls.span_depth_allowable||0).toFixed(1)})
                        </div>
                        <div style="font-size:0.7rem;color:${MUTED};margin-top:3px;">Util: ${(sls.deflection_util||0).toFixed(0)}%</div>
                    </div>
                    <div style="padding:12px;background:${crOk?'#052e16':'#450a0a'};border-radius:8px;border-left:4px solid ${crOk?PASS:FAIL};">
                        <div style="font-weight:700;color:${crOk?PASS:FAIL};margin-bottom:6px;font-family:monospace;font-size:0.78rem;">
                            Crack Control: ${crOk?'&#10003; OK':'&#10007; Review'}
                        </div>
                        <div style="font-size:0.75rem;color:${TXT};">
                            Spacing = <b>${(sls.actual_spacing||0).toFixed(0)} mm</b> (max ${(sls.max_bar_spacing||0).toFixed(0)} mm)
                        </div>
                        <div style="font-size:0.7rem;color:${MUTED};margin-top:3px;">fs = ${(sls.service_stress||0).toFixed(0)} MPa</div>
                    </div>
                </div>
            </div>`;
        }

        // ── Design summary banner
        if (hasNewFormat) {
            const botBest = (bot.bar_options||[])[0] || {};
            const topBest = (top.bar_options||[])[0] || {};
            const lkBest  = (shr.link_options||[])[1] || (shr.link_options||[])[0] || {};
            html += `
            <div style="background:#21262d;border:1px solid ${BORDER};border-radius:10px;
                        padding:16px;margin-bottom:14px;font-family:monospace;font-size:0.78rem;
                        line-height:2.0;color:${TXT};">
                <div style="color:${BLUE};font-size:0.88rem;font-weight:700;letter-spacing:0.05em;margin-bottom:8px;">
                    DESIGN SUMMARY &mdash; BS 8110:1997 (Nigerian)
                </div>
                <span style="color:${MUTED};">Section  </span><b>${b_mm}&times;${h_mm} mm &nbsp; d = ${d_eff} mm</b><br>
                <span style="color:${MUTED};">Materials</span> <b>C${fcu} &nbsp; Y${fy} &nbsp; R${fyv}</b><br>
                <span style="color:${MUTED};">Cover    </span> <b>${cov} mm</b><br>
                <span style="color:#3fb950;">Bottom &#9660;</span>
                    <b> ${botBest.label||'&mdash;'} &nbsp; As=${Math.round(bot.As_prov||0)} mm&sup2; (req ${Math.round(bot.As_req||0)} mm&sup2;)</b><br>
                <span style="color:#f47067;">Top    &#9650;</span>
                    <b> ${topBest.label||'&mdash;'} &nbsp; As=${Math.round(top.As_prov||0)} mm&sup2; (req ${Math.round(top.As_req||0)} mm&sup2;)</b><br>
                <span style="color:#d29922;">Links    </span>
                    <b> ${lkBest.label||'R8@nom'} &nbsp; (2-leg R-bars)</b>
                <hr style="border-color:${BORDER};margin:8px 0;">
                <span style="color:${MUTED};">Mu+ = ${(bot.M_design||0).toFixed(2)} kNm &rarr; </span>
                    <b style="color:#3fb950;">Mu,cap = ${(bot.Mu_cap||0).toFixed(2)} kNm</b><br>
                <span style="color:${MUTED};">Mu&minus; = ${(top.M_design||0).toFixed(2)} kNm &rarr; </span>
                    <b style="color:#f47067;">Mu,cap = ${(top.Mu_cap||0).toFixed(2)} kNm</b><br>
                <span style="color:${MUTED};">v = ${(shr.v||0).toFixed(3)} N/mm&sup2; &nbsp; vc = ${(shr.vc||0).toFixed(3)} N/mm&sup2; &rarr; </span>
                    <b style="color:${(shr.util||0)<100?PASS:WARN};">${shr.status||''}</b>
            </div>`;
        }
    }

    // ── Max Moment pill
    html += `
    <div style="background:#eff6ff;padding:12px 16px;border-radius:10px;border-left:4px solid #3b82f6;
                margin-bottom:14px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
        <span style="color:#555;font-size:13px;">Max |Moment|</span>
        <span style="color:#1e40af;font-size:22px;font-weight:700;">
            ${(data.max_moment||0).toFixed(3)}<span style="font-size:13px;color:#6b7280;"> kNm</span>
        </span>
        <span style="color:#888;font-size:13px;">at ${(data.max_moment_location||0).toFixed(2)} m</span>
        ${data.max_sagging !== undefined ? `<span style="color:#16a34a;font-size:12px;font-family:monospace;">&oplus; ${(data.max_sagging||0).toFixed(2)} kNm</span>` : ''}
        ${data.max_hogging !== undefined ? `<span style="color:#dc2626;font-size:12px;font-family:monospace;">&ominus; ${(data.max_hogging||0).toFixed(2)} kNm</span>` : ''}
    </div>`;

    // ── Reactions
    if (data.reactions && data.reactions.length > 0) {
        html += `
        <div style="background:white;padding:16px;border-radius:10px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
            <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;">Support Reactions</div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr style="background:#f8fafc;">
                    <th style="padding:7px 10px;text-align:left;border-bottom:2px solid #e5e7eb;">Node</th>
                    <th style="padding:7px 10px;text-align:left;border-bottom:2px solid #e5e7eb;">Pos (m)</th>
                    <th style="padding:7px 10px;text-align:left;border-bottom:2px solid #e5e7eb;">Type</th>
                    <th style="padding:7px 10px;text-align:right;border-bottom:2px solid #e5e7eb;">Reaction (kN)</th>
                </tr></thead><tbody>`;
        data.reactions.forEach(r => {
            html += `<tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:7px 10px;font-weight:600;">${numberToLetter(r.node)}</td>
                <td style="padding:7px 10px;">${(r.x||0).toFixed(2)}</td>
                <td style="padding:7px 10px;">${r.type}</td>
                <td style="padding:7px 10px;text-align:right;font-weight:700;color:#1e40af;">${(r.reaction||0).toFixed(3)}</td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    // ── Member moments
    if (data.moments && data.moments.length > 0) {
        html += `
        <div style="background:white;padding:16px;border-radius:10px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
            <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;">Member End Moments &amp; Shears</div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr style="background:#f8fafc;">
                    <th style="padding:7px 10px;text-align:left;border-bottom:2px solid #e5e7eb;">Span</th>
                    <th style="padding:7px 10px;text-align:right;border-bottom:2px solid #e5e7eb;">M_i (kNm)</th>
                    <th style="padding:7px 10px;text-align:right;border-bottom:2px solid #e5e7eb;">M_j (kNm)</th>
                    ${data.shears ? '<th style="padding:7px 10px;text-align:right;border-bottom:2px solid #e5e7eb;">V_i (kN)</th><th style="padding:7px 10px;text-align:right;border-bottom:2px solid #e5e7eb;">V_j (kN)</th>' : ''}
                </tr></thead><tbody>`;
        data.moments.forEach((m, i) => {
            const shear = data.shears ? data.shears[i] : null;
            html += `<tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:7px 10px;font-weight:600;">${numberToLetter(i)}&ndash;${numberToLetter(i+1)}</td>
                <td style="padding:7px 10px;text-align:right;font-weight:600;">${(m.m_i||0).toFixed(3)}</td>
                <td style="padding:7px 10px;text-align:right;font-weight:600;">${(m.m_j||0).toFixed(3)}</td>
                ${shear ? `<td style="padding:7px 10px;text-align:right;">${(shear.v_i||0).toFixed(3)}</td>
                           <td style="padding:7px 10px;text-align:right;">${(shear.v_j||0).toFixed(3)}</td>` : ''}
            </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    // ── Diagrams
    if (data.diagrams) {
        html += `
        <div style="background:white;padding:16px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
            <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:12px;">&#128202; Diagrams</div>
            <div style="margin-bottom:14px;">
                <div style="font-size:11px;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Shear Force Diagram</div>
                <img src="data:image/png;base64,${data.diagrams.sfd}" style="width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
            </div>
            <div>
                <div style="font-size:11px;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Bending Moment Diagram</div>
                <img src="data:image/png;base64,${data.diagrams.bmd}" style="width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
            </div>
        </div>`;
    }

    document.getElementById('beam-results').innerHTML = html;
}
// ===== FRAME ANALYSIS =====

function clearAllFrame() {
    if (confirm('Are you sure you want to clear all frame data?')) {
        frameNodes = [];
        frameMembers = [];
        frameLoads = [];
        document.getElementById('frame-node-x').value = '';
        document.getElementById('frame-node-y').value = '';
        document.getElementById('frame-member-i').value = '';
        document.getElementById('frame-member-j').value = '';
        document.getElementById('frame-load-member').value = '';
        document.getElementById('frame-load-mag').value = '';
        document.getElementById('frame-load-pos').value = '';
        updateFrameNodesList();
        updateFrameMembersList();
        updateFrameLoadsList();
        updateFrameVisualization();
        document.getElementById('frame-results').innerHTML = '';
    }
}

function addFrameNode() {
    const x = parseFloat(document.getElementById('frame-node-x').value);
    const y = parseFloat(document.getElementById('frame-node-y').value);
    const type = document.getElementById('frame-node-type').value;
    if (isNaN(x) || isNaN(y)) { alert('Please enter valid coordinates'); return; }
    frameNodes.push({ id: frameNodes.length, x: x, y: y, type: type });
    updateFrameNodesList();
    updateFrameVisualization();
    document.getElementById('frame-node-x').value = '';
    document.getElementById('frame-node-y').value = '';
}

function updateFrameNodesList() {
    const list = document.getElementById('frame-nodes-list');
    list.innerHTML = frameNodes.map((n, i) => `
        <div class="item">
            <span><strong>${numberToLetter(i)}</strong>: (${n.x}, ${n.y})m — ${n.type}</span>
            <button onclick="removeFrameNode(${i})">Remove</button>
        </div>
    `).join('');
}

function removeFrameNode(index) {
    frameNodes.splice(index, 1);
    frameNodes.forEach((n, i) => n.id = i);
    updateFrameNodesList();
    updateFrameVisualization();
}

function addFrameMember() {
    const iLetter = document.getElementById('frame-member-i').value.toUpperCase();
    const jLetter = document.getElementById('frame-member-j').value.toUpperCase();
    const I_mult = parseFloat(document.getElementById('frame-member-I').value);
    if (!iLetter || !jLetter || isNaN(I_mult)) { alert('Please enter valid values'); return; }
    const i = letterToNumber(iLetter);
    const j = letterToNumber(jLetter);
    if (i >= frameNodes.length || j >= frameNodes.length || i < 0 || j < 0) { alert('Invalid node letters'); return; }
    frameMembers.push({ id: frameMembers.length, node_i: i, node_j: j, I_mult: I_mult });
    updateFrameMembersList();
    updateFrameVisualization();
    document.getElementById('frame-member-i').value = '';
    document.getElementById('frame-member-j').value = '';
    document.getElementById('frame-member-I').value = '1';
}

function updateFrameMembersList() {
    const list = document.getElementById('frame-members-list');
    list.innerHTML = frameMembers.map((m, i) => {
        const label = `${numberToLetter(m.node_i)}-${numberToLetter(m.node_j)}`;
        return `
            <div class="item">
                <span>Member ${label} (I × ${m.I_mult})</span>
                <button onclick="removeFrameMember(${i})">Remove</button>
            </div>
        `;
    }).join('');
}

function removeFrameMember(index) {
    frameMembers.splice(index, 1);
    updateFrameMembersList();
    updateFrameVisualization();
}

function addFrameLoad() {
    const memberLabel = document.getElementById('frame-load-member').value.toUpperCase();
    const type = document.getElementById('frame-load-type').value;
    const mag = parseFloat(document.getElementById('frame-load-mag').value);
    const pos = parseFloat(document.getElementById('frame-load-pos').value);
    if (!memberLabel || isNaN(mag) || isNaN(pos)) { alert('Please enter valid values'); return; }
    const memberIndex = frameMembers.findIndex(m => {
        const label = `${numberToLetter(m.node_i)}${numberToLetter(m.node_j)}`;
        return label === memberLabel || label === memberLabel.split('').reverse().join('');
    });
    if (memberIndex === -1) { alert('Member not found'); return; }
    // Send both 'magnitude'/'position' AND 'mag'/'pos' for full compatibility
    frameLoads.push({
        member: memberIndex,
        type: type,
        magnitude: mag,
        mag: mag,
        position: pos,
        pos: pos
    });
    updateFrameLoadsList();
    updateFrameVisualization();
    document.getElementById('frame-load-member').value = '';
    document.getElementById('frame-load-mag').value = '';
    document.getElementById('frame-load-pos').value = '';
}

function updateFrameLoadsList() {
    const list = document.getElementById('frame-loads-list');
    list.innerHTML = frameLoads.map((l, i) => {
        const member = frameMembers[l.member];
        const label = member ? `${numberToLetter(member.node_i)}${numberToLetter(member.node_j)}` : '?';
        return `
            <div class="item">
                <span>Member ${label}: ${l.type} ${l.magnitude}kN at ${l.position}m</span>
                <button onclick="removeFrameLoad(${i})">Remove</button>
            </div>
        `;
    }).join('');
}

function removeFrameLoad(index) {
    frameLoads.splice(index, 1);
    updateFrameLoadsList();
    updateFrameVisualization();
}

function updateFrameVisualization() {
    const canvas = document.getElementById('frame-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 380;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (frameNodes.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Add nodes and members to visualize frame', canvas.width / 2, canvas.height / 2);
        return;
    }
    const xs = frameNodes.map(n => n.x);
    const ys = frameNodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padding = 80;
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    const toCanvasX = (x) => padding + (x - minX) * scale;
    const toCanvasY = (y) => canvas.height - padding - (y - minY) * scale;

    // Draw members
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 4;
    frameMembers.forEach(member => {
        const nodeI = frameNodes[member.node_i];
        const nodeJ = frameNodes[member.node_j];
        ctx.beginPath();
        ctx.moveTo(toCanvasX(nodeI.x), toCanvasY(nodeI.y));
        ctx.lineTo(toCanvasX(nodeJ.x), toCanvasY(nodeJ.y));
        ctx.stroke();
        const midX = (toCanvasX(nodeI.x) + toCanvasX(nodeJ.x)) / 2;
        const midY = (toCanvasY(nodeI.y) + toCanvasY(nodeJ.y)) / 2;
        ctx.fillStyle = '#666'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
        ctx.fillText(`${numberToLetter(member.node_i)}${numberToLetter(member.node_j)}`, midX, midY - 5);
    });

    // Draw loads
    frameLoads.forEach(load => {
        const member = frameMembers[load.member];
        if (!member) return;
        const nodeI = frameNodes[member.node_i];
        const nodeJ = frameNodes[member.node_j];
        const dx = nodeJ.x - nodeI.x;
        const dy = nodeJ.y - nodeI.y;
        const L = Math.sqrt(dx*dx + dy*dy);

        // Compute canvas direction of member
        const L_canvas_vec = { x: toCanvasX(nodeJ.x) - toCanvasX(nodeI.x), y: toCanvasY(nodeJ.y) - toCanvasY(nodeI.y) };
        const L_canvas = Math.sqrt(L_canvas_vec.x**2 + L_canvas_vec.y**2);
        const nx = L_canvas > 0 ? L_canvas_vec.x / L_canvas : 1;
        const ny = L_canvas > 0 ? L_canvas_vec.y / L_canvas : 0;

        // Perpendicular (CW rotation in canvas = outward normal for gravity on beams, lateral on columns)
        // perpX = ny, perpY = -nx
        // For horizontal member: nx=1, ny=0 → perpX=0, perpY=-1 → arrow from ABOVE ✓
        // For vertical member:   nx=0, ny=1 → perpX=1, perpY=0  → arrow from RIGHT ✓
        const perpX = ny;
        const perpY = -nx;

        const arrowLength = 50;

        if (load.type === 'point' || load.type === 'Point') {
            const ratio = (load.position || load.pos || 0) / L;
            const loadX = toCanvasX(nodeI.x + dx * ratio);
            const loadY = toCanvasY(nodeI.y + dy * ratio);

            // Arrow starts perpArrowLength away in the perpendicular direction
            const arrowStartX = loadX + perpX * arrowLength;
            const arrowStartY = loadY + perpY * arrowLength;

            ctx.strokeStyle = '#e74c3c'; ctx.fillStyle = '#e74c3c'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(arrowStartX, arrowStartY); ctx.lineTo(loadX, loadY); ctx.stroke();

            // Arrowhead pointing toward member
            const headDir = { x: loadX - arrowStartX, y: loadY - arrowStartY };
            const headLen = Math.sqrt(headDir.x**2 + headDir.y**2);
            if (headLen > 0) {
                const hx = headDir.x / headLen;
                const hy = headDir.y / headLen;
                const arrowSize = 8;
                ctx.beginPath();
                ctx.moveTo(loadX, loadY);
                ctx.lineTo(loadX - hx * arrowSize - hy * arrowSize * 0.5,
                           loadY - hy * arrowSize + hx * arrowSize * 0.5);
                ctx.lineTo(loadX - hx * arrowSize + hy * arrowSize * 0.5,
                           loadY - hy * arrowSize - hx * arrowSize * 0.5);
                ctx.closePath(); ctx.fill();
            }

            ctx.fillStyle = '#000'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`${load.magnitude || load.mag} kN`, arrowStartX + perpX * 8, arrowStartY + perpY * 8);

        } else if (load.type === 'udl' || load.type === 'UDL') {
            const numArrows = Math.max(4, Math.floor(L * Math.min(Math.abs(nx) > 0.5 ? (toCanvasX(nodeJ.x) - toCanvasX(nodeI.x)) : (toCanvasY(nodeI.y) - toCanvasY(nodeJ.y)), 300) / 50));
            ctx.strokeStyle = '#3498db'; ctx.fillStyle = '#3498db'; ctx.lineWidth = 2;
            const points = [];
            for (let i = 0; i <= numArrows; i++) {
                const ratio = i / numArrows;
                points.push({
                    x: toCanvasX(nodeI.x + dx * ratio),
                    y: toCanvasY(nodeI.y + dy * ratio)
                });
            }
            // Draw individual arrows perpendicular to member
            for (let i = 0; i <= numArrows; i++) {
                const px = points[i].x, py = points[i].y;
                const startX = px + perpX * arrowLength;
                const startY = py + perpY * arrowLength;
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(px, py); ctx.stroke();
                // Arrowhead toward member
                const hx2 = -perpX, hy2 = -perpY;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px - hx2 * 7 - hy2 * 4, py - hy2 * 7 + hx2 * 4);
                ctx.lineTo(px - hx2 * 7 + hy2 * 4, py - hy2 * 7 - hx2 * 4);
                ctx.closePath(); ctx.fill();
            }
            // Top line of UDL
            ctx.beginPath();
            ctx.moveTo(points[0].x + perpX * arrowLength, points[0].y + perpY * arrowLength);
            for (let i = 1; i <= numArrows; i++) {
                ctx.lineTo(points[i].x + perpX * arrowLength, points[i].y + perpY * arrowLength);
            }
            ctx.stroke();
            // Label
            const midIdx = Math.floor(numArrows / 2);
            ctx.fillStyle = '#000'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`${load.magnitude || load.mag} kN/m`,
                         points[midIdx].x + perpX * (arrowLength + 18),
                         points[midIdx].y + perpY * (arrowLength + 18));
        }
    });

    // Draw nodes
    frameNodes.forEach((node, index) => {
        const x = toCanvasX(node.x), y = toCanvasY(node.y);
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        if (node.type === 'fixed') {
            ctx.fillStyle = '#8B4513'; ctx.fillRect(x - 10, y + 6, 20, 6);
        } else if (node.type === 'pinned') {
            ctx.fillStyle = '#4169E1';
            ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x - 8, y + 18); ctx.lineTo(x + 8, y + 18);
            ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
        ctx.fillText(numberToLetter(index), x, y - 12);
    });
}

async function analyzeFrame() {
    if (frameNodes.length < 2 || frameMembers.length < 1) {
        alert('Please add at least 2 nodes and 1 member');
        return;
    }
    document.getElementById('frame-loading').classList.add('active');
    document.getElementById('frame-results').innerHTML = '';
    try {
        const E = parseFloat(document.getElementById('frame-E').value) * 1e9;
        const I_base = parseFloat(document.getElementById('frame-I').value) * 1e-6;
        const canSway = document.getElementById('frame-can-sway') 
                        ? document.getElementById('frame-can-sway').checked 
                        : false;
        const response = await fetch('/api/frame/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nodes: frameNodes,
                members: frameMembers.map(m => ({ ...m, E: E, I: I_base * m.I_mult })),
                loads: frameLoads,
                can_sway: canSway
            })
        });
        const data = await response.json();
        if (data.success) {
            // Design critical members
            const designCode = document.getElementById('frame-design-code').value;
            const fck = parseFloat(document.getElementById('frame-design-fck').value);
            const fy = parseFloat(document.getElementById('frame-design-fy').value);
            const beamWidth = parseFloat(document.getElementById('frame-beam-width').value) || 300;
            const columnSize = parseFloat(document.getElementById('frame-column-size').value) || 300;
            const cover = parseFloat(document.getElementById('frame-design-cover').value) || 40;
            const barDia = parseFloat(document.getElementById('frame-design-bar-dia').value) || 16;
            
            // Find critical beam (horizontal member with max moment)
            let maxBeamMoment = 0;
            let maxBeamShear = 0;
            let maxBeamLength = 0;
            let criticalBeamIndex = -1;
            
            data.member_forces.forEach((m, i) => {
                const member = frameMembers[m.member];
                if (member) {
                    const ni = frameNodes[member.node_i];
                    const nj = frameNodes[member.node_j];
                    const isHorizontal = Math.abs(ni.y - nj.y) < 0.01;
                    const L = Math.sqrt((nj.x - ni.x)**2 + (nj.y - ni.y)**2);
                    
                    if (isHorizontal) {
                        const memberMoment = Math.max(Math.abs(m.M_ab), Math.abs(m.M_ba));
                        const memberShear = Math.max(Math.abs(m.V_a), Math.abs(m.V_b));
                        if (memberMoment > maxBeamMoment) {
                            maxBeamMoment = memberMoment;
                            maxBeamShear = memberShear;
                            maxBeamLength = L;
                            criticalBeamIndex = i;
                        }
                    }
                }
            });
            
            // Find critical column (vertical member with max moment)
            // Use max support Ry as axial load (server sets member N_a/N_b = 0 always)
            let maxColumnAxial = 0;
            let maxColumnMoment = 0;
            let maxColumnLength = 0;
            let criticalColumnIndex = -1;

            // Derive axial load from support reactions (Ry = vertical reaction = column axial)
            if (data.reactions) {
                data.reactions.forEach(r => {
                    maxColumnAxial = Math.max(maxColumnAxial, Math.abs(r.Ry || 0));
                });
            }

            data.member_forces.forEach((m, i) => {
                const member = frameMembers[m.member];
                if (member) {
                    const ni = frameNodes[member.node_i];
                    const nj = frameNodes[member.node_j];
                    const isVertical = Math.abs(ni.x - nj.x) < 0.01;
                    const L = Math.sqrt((nj.x - ni.x)**2 + (nj.y - ni.y)**2);
                    
                    if (isVertical) {
                        const memberMoment = Math.max(Math.abs(m.M_ab), Math.abs(m.M_ba));
                        if (memberMoment > maxColumnMoment) {
                            maxColumnMoment = memberMoment;
                            maxColumnLength = L;
                            criticalColumnIndex = i;
                        }
                    }
                }
            });
            
            // Design critical beam
            let beamDesign = null;
            if (maxBeamMoment > 0) {
                const beamDesignParams = {
                    design_code: designCode,
                    max_moment: maxBeamMoment,
                    max_shear: maxBeamShear,
                    L_max: maxBeamLength,
                    width: beamWidth,
                    fck: fck,
                    fy: fy,
                    cover: cover,
                    bar_dia: barDia
                };
                
                const beamDesignResponse = await fetch('/api/design/beam', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(beamDesignParams)
                });
                beamDesign = await beamDesignResponse.json();
            }
            
            // Design critical column
            let columnDesign = null;
            if (maxColumnMoment > 0 || maxColumnAxial > 0) {
                const columnDesignParams = {
                    design_code: designCode,
                    axial_force: maxColumnAxial,
                    moment: maxColumnMoment,
                    length: maxColumnLength,
                    width: columnSize,
                    depth: columnSize,
                    fck: fck,
                    fyk: fy,
                    cover: cover,
                    bar_dia: barDia
                };
                
                const columnDesignResponse = await fetch('/api/design/column', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(columnDesignParams)
                });
                columnDesign = await columnDesignResponse.json();
            }
            
            displayFrameResults(data, beamDesign, columnDesign, barDia);
        } else {
            throw new Error(data.error || 'Frame analysis failed');
        }
    } catch (error) {
        document.getElementById('frame-results').innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><small>Make sure the API server is running: python api_server_complete.py</small>
            </div>
        `;
    } finally {
        document.getElementById('frame-loading').classList.remove('active');
    }
}

function displayFrameResults(data, beamDesign, columnDesign, barDia) {
    let html = '';

    // BEAM DESIGN RESULTS
    if (beamDesign && beamDesign.success) {
        // Detect code type
        const isIS456 = beamDesign.code && beamDesign.code.includes('IS 456');
        const isBSEN = beamDesign.code && beamDesign.code.includes('BS EN');
        const isBS8110 = beamDesign.code && beamDesign.code.includes('BS 8110');
        
        // For IS456, data is flat; for BS codes, data is nested
        const hasNestedStructure = beamDesign.uls !== undefined;
        const ulsData = hasNestedStructure ? beamDesign.uls : beamDesign;
        const slsData = hasNestedStructure ? beamDesign.sls : null;
        
        const beamWidth = parseFloat(document.getElementById('frame-beam-width').value) || 300;
        
        let codeLabel = 'Beam Design';
        if (isIS456) codeLabel = 'Beam Design (IS 456)';
        else if (isBSEN) codeLabel = 'Beam Design (BS EN 1992 - ULS)';
        else if (isBS8110) codeLabel = 'Beam Design (BS 8110 - ULS)';
        
        html += `
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 22px; border-radius: 12px; margin-bottom: 16px; color: white;">
            <div style="font-size: 13px; font-weight: 600; opacity: 0.85; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${codeLabel}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px; margin-bottom: 14px;">
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Depth</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${Math.round(ulsData.depth || ulsData.eff_depth)}<span style="font-size: 13px; opacity: 0.8;"> mm</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Steel Area</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${Math.round(ulsData.steel_area_req || ulsData.steel_area)}<span style="font-size: 13px; opacity: 0.8;"> mm²</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Bars</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${ulsData.num_bars}<span style="font-size: 13px; opacity: 0.8;">×${Math.round(ulsData.bar_size || barDia)}mm</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Provided</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${Math.round(ulsData.steel_area_prov || ulsData.provided_area)}<span style="font-size: 13px; opacity: 0.8;"> mm²</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Utilization</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${(ulsData.utilization || 0).toFixed(0)}<span style="font-size: 13px; opacity: 0.8;">%</span></div>
                </div>
            </div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 14px; font-size: 13px;">
                <span>${ulsData.section_type || 'Singly Reinforced'}</span> • <span>${Math.round(beamWidth)}mm × ${Math.round(ulsData.depth || 450)}mm</span>
            </div>
        </div>`;
        
        // SLS checks (available for both BS 8110 and BS EN 1992)
        if (slsData) {
            html += `
            <div style="background: white; padding: 16px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.08);">
                <div style="font-size: 13px; font-weight: 600; color: #444; margin-bottom: 12px;">Beam SLS Checks</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                    <div style="padding: 10px; background: ${slsData.deflection_check === 'OK' ? '#f0fdf4' : '#fef2f2'}; border-radius: 6px; border-left: 3px solid ${slsData.deflection_check === 'OK' ? '#22c55e' : '#ef4444'};">
                        <div style="font-weight: 600; margin-bottom: 4px;">Deflection: ${slsData.deflection_check}</div>
                        <div style="font-size: 12px; color: #666;">Span/depth: ${slsData.span_depth_actual.toFixed(1)} / ${slsData.span_depth_allowable.toFixed(1)}</div>
                    </div>
                    <div style="padding: 10px; background: ${slsData.crack_check === 'OK' ? '#f0fdf4' : '#fef2f2'}; border-radius: 6px; border-left: 3px solid ${slsData.crack_check === 'OK' ? '#22c55e' : '#ef4444'};">
                        <div style="font-weight: 600; margin-bottom: 4px;">Crack: ${slsData.crack_check}</div>
                        <div style="font-size: 12px; color: #666;">Spacing: ${slsData.actual_spacing.toFixed(0)}mm / ${slsData.max_bar_spacing.toFixed(0)}mm</div>
                    </div>
                </div>
            </div>`;
        }
    }
    
    // COLUMN DESIGN RESULTS
    if (columnDesign && columnDesign.success) {
        // Detect code type
        const isIS456 = columnDesign.code && columnDesign.code.includes('IS 456');
        const isBSEN = columnDesign.code && columnDesign.code.includes('BS EN');
        const isBS8110 = columnDesign.code && columnDesign.code.includes('BS 8110');
        
        // For IS456, data is flat; for BS codes, data is nested
        const hasNestedStructure = columnDesign.uls !== undefined;
        const ulsData = hasNestedStructure ? columnDesign.uls : columnDesign;
        const slsData = hasNestedStructure ? columnDesign.sls : null;
        
        const columnSize = parseFloat(document.getElementById('frame-column-size').value) || 300;
        
        let codeLabel = 'Column Design';
        if (isIS456) codeLabel = 'Column Design (IS 456)';
        else if (isBSEN) codeLabel = 'Column Design (BS EN 1992 - ULS)';
        else if (isBS8110) codeLabel = 'Column Design (BS 8110 - ULS)';
        
        html += `
        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); padding: 22px; border-radius: 12px; margin-bottom: 16px; color: white;">
            <div style="font-size: 13px; font-weight: 600; opacity: 0.85; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${codeLabel}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px; margin-bottom: 14px;">
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Steel Area</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${Math.round(ulsData.steel_area_req || ulsData.steel_area)}<span style="font-size: 13px; opacity: 0.8;"> mm²</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Bars</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${ulsData.num_bars}<span style="font-size: 13px; opacity: 0.8;">×${Math.round(ulsData.bar_size || barDia)}mm</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Provided</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${Math.round(ulsData.steel_area_prov || ulsData.provided_area)}<span style="font-size: 13px; opacity: 0.8;"> mm²</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Capacity</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${(ulsData.axial_capacity || 0).toFixed(0)}<span style="font-size: 13px; opacity: 0.8;"> kN</span></div>
                </div>
                <div>
                    <div style="opacity: 0.75; font-size: 11px;">Utilization</div>
                    <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${(ulsData.utilization || 0).toFixed(0)}<span style="font-size: 13px; opacity: 0.8;">%</span></div>
                </div>
            </div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 14px; font-size: 13px;">
                <span>${ulsData.category || ulsData.slenderness_category || 'Column'}</span> • <span>${Math.round(columnSize)}mm × ${Math.round(columnSize)}mm</span> • <span>${(ulsData.steel_percentage || 0).toFixed(2)}% steel</span>
            </div>
        </div>`;
        
        if (slsData) {
            html += `
            <div style="background: white; padding: 16px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.08);">
                <div style="font-size: 13px; font-weight: 600; color: #444; margin-bottom: 8px;">Column SLS Checks</div>
                <div style="font-size: 13px;">Cover: ${slsData.cover_check}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Link: ø${slsData.min_link_dia.toFixed(0)}mm @ ${slsData.max_link_spacing.toFixed(0)}mm max</div>
            </div>`;
        }
    }

    // SWAY BADGE (if applicable)
    const swayMm = (data.sway_delta || 0) * 1000;
    if (Math.abs(swayMm) > 0.001) {
        html += `
        <div style="background: #fff8e1; padding: 12px 16px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-bottom: 16px; display: flex; align-items: baseline; gap: 10px;">
            <span style="color: #92400e; font-size: 13px;">Lateral Sway (Δ)</span>
            <span style="color: #78350f; font-size: 22px; font-weight: 700;">${swayMm.toFixed(3)} mm</span>
        </div>`;
    }

    // MAX MOMENT + MAX SHEAR
    if (data.max_moment !== undefined) {
        html += `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            <div style="background:#f0f4ff; padding:12px 16px; border-radius:10px; border-left:4px solid #667eea;">
                <span style="color:#555; font-size:12px; display:block;">Max Moment</span>
                <span style="color:#333; font-size:22px; font-weight:700;">${(data.max_moment||0).toFixed(3)}<span style="font-size:13px; color:#888;"> kNm</span></span>
            </div>
            <div style="background:#f0fff4; padding:12px 16px; border-radius:10px; border-left:4px solid #38a169;">
                <span style="color:#555; font-size:12px; display:block;">Max Shear</span>
                <span style="color:#333; font-size:22px; font-weight:700;">${(data.max_shear||0).toFixed(3)}<span style="font-size:13px; color:#888;"> kN</span></span>
            </div>
        </div>`;
    }

    // MEMBER FORCES TABLE
    if (data.member_forces && data.member_forces.length > 0) {
        html += `
        <div style="background: white; padding: 16px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.08);">
            <div style="font-size: 13px; font-weight: 600; color: #444; margin-bottom: 10px;">Member End Moments & Forces</div>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead><tr style="background:#f7f7f7;">
                    <th style="padding:7px 10px; text-align:left; border-bottom:2px solid #eee;">Member</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">M<sub>AB</sub> (kNm)</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">M<sub>BA</sub> (kNm)</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">V<sub>A</sub> (kN)</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">V<sub>B</sub> (kN)</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">N<sub>A</sub> (kN)</th>
                </tr></thead>
                <tbody>`;
        data.member_forces.forEach((m) => {
            const ni = frameMembers[m.member] ? frameMembers[m.member].node_i : m.member;
            const nj = frameMembers[m.member] ? frameMembers[m.member].node_j : m.member + 1;
            const label = (ni !== undefined && nj !== undefined)
                ? `${numberToLetter(ni)}–${numberToLetter(nj)}`
                : `M${m.member}`;
            html += `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:7px 10px;">${label}</td>
                <td style="padding:7px 10px; text-align:right; font-weight:600;">${(m.M_ab || 0).toFixed(3)}</td>
                <td style="padding:7px 10px; text-align:right; font-weight:600;">${(m.M_ba || 0).toFixed(3)}</td>
                <td style="padding:7px 10px; text-align:right;">${(m.V_a || 0).toFixed(3)}</td>
                <td style="padding:7px 10px; text-align:right;">${(m.V_b || 0).toFixed(3)}</td>
                <td style="padding:7px 10px; text-align:right;">${(m.N_a || 0).toFixed(3)}</td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    // REACTIONS TABLE
    if (data.reactions && data.reactions.length > 0) {
        html += `
        <div style="background: white; padding: 16px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.08);">
            <div style="font-size: 13px; font-weight: 600; color: #444; margin-bottom: 10px;">Support Reactions</div>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead><tr style="background:#f7f7f7;">
                    <th style="padding:7px 10px; text-align:left; border-bottom:2px solid #eee;">Node</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">R<sub>x</sub> (kN)</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">R<sub>y</sub> (kN)</th>
                    <th style="padding:7px 10px; text-align:right; border-bottom:2px solid #eee;">M (kNm)</th>
                </tr></thead>
                <tbody>`;
        data.reactions.forEach(r => {
            html += `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:7px 10px;">${numberToLetter(r.node)}</td>
                <td style="padding:7px 10px; text-align:right; font-weight:600;">${(r.Rx || 0).toFixed(3)}</td>
                <td style="padding:7px 10px; text-align:right; font-weight:600;">${(r.Ry || 0).toFixed(3)}</td>
                <td style="padding:7px 10px; text-align:right; font-weight:600;">${(r.M || 0).toFixed(3)}</td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
    }

    // DIAGRAMS (BMD + SFD on frame geometry — generated by server)
    if (data.diagrams) {
        html += `
        <div style="background: white; padding: 16px; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,0.08);">
            <div style="font-size: 13px; font-weight: 600; color: #444; margin-bottom: 12px;">Diagrams</div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">Bending Moment Diagram</div>
                <img src="data:image/png;base64,${data.diagrams.bmd}" style="width:100%; border-radius:6px;">
            </div>
            <div>
                <div style="font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">Shear Force Diagram</div>
                <img src="data:image/png;base64,${data.diagrams.sfd}" style="width:100%; border-radius:6px;">
            </div>
        </div>`;
    }

    document.getElementById('frame-results').innerHTML = html;
}

// Initialize
window.addEventListener('load', () => {
    updateVisualization();
    updateLoadInputs();
});
