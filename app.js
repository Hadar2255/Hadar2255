/* ===== Garmin × Gemini Dashboard ===== */
'use strict';

const DATA_DIR = 'data/';
let latestData = null;
let historyIndex = [];

// Chart.js defaults for RTL Hebrew
Chart.defaults.font.family = "'Heebo', 'Segoe UI', sans-serif";
Chart.defaults.color = '#64748b';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function safeNum(v, decimals = 0) {
  if (v === null || v === undefined || v === 'N/A') return null;
  return parseFloat(Number(v).toFixed(decimals));
}

async function fetchJSON(path) {
  const r = await fetch(path + '?t=' + Date.now());
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${path}`);
  return r.json();
}

function makeChart(id, type, labels, datasets, options = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (ctx._chart) ctx._chart.destroy();
  ctx._chart = new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', rtl: true } },
      scales: {
        x: { ticks: { maxRotation: 30, font: { size: 11 } } },
        y: { ticks: { font: { size: 11 } } }
      },
      ...options
    }
  });
}

// ── Tab Switching ────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Summary Cards ────────────────────────────────────────────────────────────

function renderSummaryCards(data) {
  const s = data.summary || {};
  const acts = data.activities || [];

  const totalKm = acts.reduce((sum, a) => sum + (a.distance_km || 0), 0).toFixed(1);
  const avgHR   = acts.filter(a => a.avg_hr).map(a => a.avg_hr);
  const avgHRval = avgHR.length ? Math.round(avgHR.reduce((a, b) => a + b) / avgHR.length) : null;

  const cards = [
    { icon: '🏃', value: s.total_runs || acts.length, label: 'ריצות שנותחו', sub: `ב-14 ימים`, cls: '' },
    { icon: '📏', value: totalKm + ' ק"מ', label: 'סה"כ מרחק', sub: '', cls: '' },
    {
      icon: '🦶',
      value: s.avg_cadence ? s.avg_cadence + ' spm' : 'N/A',
      label: 'קידוד ממוצע',
      sub: s.avg_cadence ? (s.avg_cadence >= 170 ? '✅ מעולה' : s.avg_cadence >= 160 ? '⚠️ לשפר' : '❗ נמוך') : '',
      cls: s.avg_cadence >= 170 ? 'good' : s.avg_cadence >= 160 ? 'warn' : 'bad'
    },
    {
      icon: '⏱️',
      value: s.avg_gct_ms ? s.avg_gct_ms + ' ms' : 'N/A',
      label: 'GCT ממוצע',
      sub: s.avg_gct_ms ? (s.avg_gct_ms <= 270 ? '✅ טוב' : '⚠️ גבוה') : '',
      cls: s.avg_gct_ms <= 270 ? 'good' : 'warn'
    },
    {
      icon: '↕️',
      value: s.avg_vertical_oscillation_cm ? s.avg_vertical_oscillation_cm + ' cm' : 'N/A',
      label: 'תנודה אנכית',
      sub: s.avg_vertical_oscillation_cm ? (s.avg_vertical_oscillation_cm <= 9 ? '✅ טוב' : '⚠️ גבוה') : '',
      cls: s.avg_vertical_oscillation_cm <= 9 ? 'good' : 'warn'
    },
    { icon: '❤️', value: avgHRval || 'N/A', label: 'דופק ממוצע', sub: 'bpm', cls: '' },
  ];

  document.getElementById('summaryCards').innerHTML = cards.map(c => `
    <div class="card ${c.cls}">
      <div class="card-icon">${c.icon}</div>
      <div class="card-value">${c.value}</div>
      <div class="card-label">${c.label}</div>
      ${c.sub ? `<div class="card-sub">${c.sub}</div>` : ''}
    </div>
  `).join('');
}

// ── Gemini Analysis ──────────────────────────────────────────────────────────

function renderAnalysis(data) {
  const box = document.getElementById('geminiAnalysis');
  if (data.gemini_analysis) {
    box.innerHTML = marked.parse(data.gemini_analysis);
  } else {
    box.innerHTML = '<p class="loading-text">📭 עדיין אין ניתוח. הרץ את ה-Colab Notebook כדי ליצור ניתוח ראשון.</p>';
  }
}

// ── Biomechanics Charts ──────────────────────────────────────────────────────

function renderBiomechanicsCharts(data) {
  const acts = (data.activities || []).slice().reverse(); // chronological
  const labels = acts.map(a => a.date ? a.date.slice(5) : ''); // MM-DD

  // Cadence
  makeChart('cadenceChart', 'line', labels, [
    {
      label: 'קידוד ממוצע (spm)',
      data: acts.map(a => safeNum(a.avg_cadence)),
      borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)',
      fill: true, tension: .3, pointRadius: 4
    },
    {
      label: 'מטרה: 175 spm',
      data: acts.map(() => 175),
      borderColor: '#dc2626', borderDash: [6, 4],
      pointRadius: 0, borderWidth: 2
    }
  ]);

  // GCT
  makeChart('gctChart', 'line', labels, [
    {
      label: 'GCT ממוצע (ms)',
      data: acts.map(a => safeNum(a.avg_gct_ms)),
      borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,.1)',
      fill: true, tension: .3, pointRadius: 4
    },
    {
      label: 'מטרה מקסימלית: 270 ms',
      data: acts.map(() => 270),
      borderColor: '#dc2626', borderDash: [6, 4],
      pointRadius: 0, borderWidth: 2
    }
  ]);

  // Vertical Oscillation
  makeChart('vertOscChart', 'line', labels, [
    {
      label: 'תנודה אנכית (cm)',
      data: acts.map(a => safeNum(a.avg_vertical_oscillation_cm, 1)),
      borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.1)',
      fill: true, tension: .3, pointRadius: 4
    },
    {
      label: 'מטרה מקסימלית: 9 cm',
      data: acts.map(() => 9),
      borderColor: '#dc2626', borderDash: [6, 4],
      pointRadius: 0, borderWidth: 2
    }
  ]);

  // Power
  makeChart('powerChart', 'bar', labels, [
    {
      label: 'עוצמה ממוצעת (W)',
      data: acts.map(a => safeNum(a.avg_power)),
      backgroundColor: 'rgba(249,115,22,.7)',
      borderColor: '#f97316', borderWidth: 1, borderRadius: 6
    }
  ]);
}

// ── Training Load Charts ─────────────────────────────────────────────────────

function renderLoadCharts(data) {
  const acts = (data.activities || []).slice().reverse();
  const labels = acts.map(a => a.date ? a.date.slice(5) : '');

  // Training Effect
  makeChart('teChart', 'bar', labels, [
    {
      label: 'אירובי',
      data: acts.map(a => safeNum(a.aerobic_te, 1)),
      backgroundColor: 'rgba(37,99,235,.7)',
      borderRadius: 4
    },
    {
      label: 'אנאירובי',
      data: acts.map(a => safeNum(a.anaerobic_te, 1)),
      backgroundColor: 'rgba(249,115,22,.7)',
      borderRadius: 4
    }
  ], {
    scales: {
      x: { ticks: { maxRotation: 30, font: { size: 11 } } },
      y: { min: 0, max: 5, ticks: { font: { size: 11 }, stepSize: 1 } }
    }
  });

  // HRV
  const hrv = (data.hrv || []).slice().reverse();
  if (hrv.length) {
    makeChart('hrvChart', 'line', hrv.map(h => h.date ? h.date.slice(5) : ''), [
      {
        label: 'HRV לאחר לילה (ms)',
        data: hrv.map(h => safeNum(h.last_night)),
        borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,.1)',
        fill: true, tension: .3, pointRadius: 4
      },
      {
        label: 'ממוצע שבועי (ms)',
        data: hrv.map(h => safeNum(h.weekly_avg)),
        borderColor: '#64748b', borderDash: [5, 3],
        pointRadius: 0, borderWidth: 2
      }
    ]);
  }

  // Sleep
  const sleep = (data.sleep || []).slice().reverse();
  if (sleep.length) {
    makeChart('sleepChart', 'bar', sleep.map(s => s.date ? s.date.slice(5) : ''), [
      {
        label: 'שינה עמוקה (שעות)',
        data: sleep.map(s => safeNum(s.deep_sleep_hours, 1)),
        backgroundColor: 'rgba(37,99,235,.8)', borderRadius: 4
      },
      {
        label: 'REM (שעות)',
        data: sleep.map(s => safeNum(s.rem_sleep_hours, 1)),
        backgroundColor: 'rgba(124,58,237,.7)', borderRadius: 4
      },
      {
        label: 'שאר השינה',
        data: sleep.map(s => {
          const total = safeNum(s.duration_hours, 1) || 0;
          const deep  = safeNum(s.deep_sleep_hours, 1) || 0;
          const rem   = safeNum(s.rem_sleep_hours, 1) || 0;
          return safeNum(Math.max(0, total - deep - rem), 1);
        }),
        backgroundColor: 'rgba(100,116,139,.4)', borderRadius: 4
      }
    ], { scales: { x: { stacked: true }, y: { stacked: true } } });
  }
}

// ── History ──────────────────────────────────────────────────────────────────

function renderHistory(index) {
  const list = document.getElementById('historyList');
  if (!index.length) {
    list.innerHTML = '<p class="loading-text">📭 אין ניתוחים עדיין. הרץ את ה-Notebook ליצירת ניתוח ראשון.</p>';
    return;
  }

  list.innerHTML = index.map(item => `
    <div class="history-item" onclick="loadAnalysis('${item.file}')">
      <div>
        <div class="hist-date">${fmtDate(item.date)}</div>
        <div class="hist-meta">
          ${item.runs ? item.runs + ' ריצות' : ''}
          ${item.avg_cadence ? ' | קידוד: ' + item.avg_cadence + ' spm' : ''}
        </div>
      </div>
      <div class="hist-arrow">←</div>
    </div>
  `).join('');
}

async function loadAnalysis(filePath) {
  try {
    const data = await fetchJSON(filePath);
    latestData = data;
    document.querySelectorAll('.tab')[0].click(); // go to analysis tab
    renderSummaryCards(data);
    renderAnalysis(data);
    renderBiomechanicsCharts(data);
    renderLoadCharts(data);
    document.getElementById('lastUpdate').textContent =
      '📅 ניתוח מתאריך: ' + fmtDate(data.date);
  } catch (e) {
    alert('שגיאה בטעינת הניתוח: ' + e.message);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // Load index
  try {
    historyIndex = await fetchJSON(DATA_DIR + 'index.json');
    renderHistory(historyIndex);
  } catch {
    historyIndex = [];
    renderHistory([]);
  }

  // Load latest
  try {
    latestData = await fetchJSON(DATA_DIR + 'latest.json');
    document.getElementById('lastUpdate').textContent =
      '📅 עדכון אחרון: ' + fmtDate(latestData.date);
    renderSummaryCards(latestData);
    renderAnalysis(latestData);
    renderBiomechanicsCharts(latestData);
    renderLoadCharts(latestData);
  } catch {
    document.getElementById('lastUpdate').textContent = '📭 אין נתונים עדיין — הרץ את ה-Notebook';
    document.getElementById('summaryCards').innerHTML =
      '<p class="loading-text">📭 אין נתונים. <a href="https://colab.research.google.com/github/Hadar2255/Hadar2255/blob/main/garmin_gemini.ipynb" target="_blank">הרץ את ה-Notebook</a> כדי ליצור ניתוח ראשון.</p>';
    document.getElementById('geminiAnalysis').innerHTML =
      '<p class="loading-text">📭 עדיין אין ניתוח. הרץ את ה-Colab Notebook ← תוצאות יופיעו כאן.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);
