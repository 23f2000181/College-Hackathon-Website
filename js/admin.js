/* ═══════════════════════════════════════════════
   HackVerse — Admin Panel Logic
   ═══════════════════════════════════════════════ */

import { PROBLEM_STATEMENTS, DEPT_NAMES, getSelectedPS } from '/js/shared.js';

// ─── AUTH GUARD ───
const session = JSON.parse(localStorage.getItem('hackverse_session') || 'null');
if (!session || !session.isAdmin) {
  window.location.href = '/login.html';
}

// ─── LOGOUT ───
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('hackverse_session');
  window.location.href = '/';
});

// ─── HELPERS ───
function getTeams() {
  return JSON.parse(localStorage.getItem('hackverse_teams') || '[]');
}

function getCustomPS() {
  return JSON.parse(localStorage.getItem('hackverse_custom_ps') || 'null');
}

function saveCustomPS(data) {
  localStorage.setItem('hackverse_custom_ps', JSON.stringify(data));
}

function getAllPS() {
  const custom = getCustomPS();
  if (custom) return custom;
  // Deep clone the defaults
  return JSON.parse(JSON.stringify(PROBLEM_STATEMENTS));
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── TAB SWITCHING ───
const tabs = document.querySelectorAll('.admin-tab');
const panels = document.querySelectorAll('.admin-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.remove('hidden');

    // Re-render tab content
    if (tab.dataset.tab === 'overview') renderOverview();
    if (tab.dataset.tab === 'registrations') renderRegistrations();
    if (tab.dataset.tab === 'problems') renderPSList();
  });
});

// ═════════════════════════════════════════
//  OVERVIEW TAB
// ═════════════════════════════════════════
function renderOverview() {
  const teams = getTeams();
  const allPS = getAllPS();

  // Stats
  document.getElementById('stat-teams').textContent = teams.length;
  document.getElementById('stat-participants').textContent = teams.length * 4;

  let psSelectedCount = 0;
  teams.forEach((t) => {
    const ps = getSelectedPS(t.id);
    if (ps) psSelectedCount++;
  });
  document.getElementById('stat-ps-selected').textContent = psSelectedCount;

  let totalPS = 0;
  Object.values(allPS).forEach((arr) => (totalPS += arr.length));
  document.getElementById('stat-total-ps').textContent = totalPS;

  // Dept breakdown
  const deptCounts = {};
  Object.keys(DEPT_NAMES).forEach((k) => (deptCounts[k] = 0));
  teams.forEach((t) => {
    if (deptCounts[t.department] !== undefined) deptCounts[t.department]++;
  });

  const maxCount = Math.max(...Object.values(deptCounts), 1);
  const colors = ['#FF00E4', '#33CCFF', '#FFD700', '#00E49F', '#A855F7', '#FF7A33', '#33CCFF'];
  const barsEl = document.getElementById('dept-bars');
  barsEl.innerHTML = '';

  Object.entries(DEPT_NAMES).forEach(([key, name], i) => {
    const count = deptCounts[key] || 0;
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

    const row = document.createElement('div');
    row.className = 'dept-bar-row';
    row.innerHTML = `
      <span class="dept-bar-label">${name}</span>
      <div class="dept-bar-track">
        <div class="dept-bar-fill" style="width: ${pct}%; background: ${colors[i % colors.length]};"></div>
      </div>
      <span class="dept-bar-count">${count} team${count !== 1 ? 's' : ''}</span>
    `;
    barsEl.appendChild(row);
  });

  // Recent registrations (last 5)
  const recentBody = document.getElementById('recent-body');
  const recentEmpty = document.getElementById('recent-empty');
  recentBody.innerHTML = '';

  if (teams.length === 0) {
    recentEmpty.style.display = 'block';
    document.getElementById('recent-table').style.display = 'none';
  } else {
    recentEmpty.style.display = 'none';
    document.getElementById('recent-table').style.display = '';

    const recent = [...teams].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)).slice(0, 5);
    recent.forEach((team) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="leader-cell">${team.leaderName}</td>
        <td>${DEPT_NAMES[team.department] || team.department}</td>
        <td>${team.members ? team.members.length : 0}</td>
        <td>${formatDate(team.registeredAt)}</td>
      `;
      recentBody.appendChild(tr);
    });
  }
}

// ═════════════════════════════════════════
//  REGISTRATIONS TAB
// ═════════════════════════════════════════
let searchQuery = '';
let filterDept = 'all';

document.getElementById('search-teams').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderRegistrations();
});

document.getElementById('filter-dept').addEventListener('change', (e) => {
  filterDept = e.target.value;
  renderRegistrations();
});

function renderRegistrations() {
  const teams = getTeams();
  const tbody = document.getElementById('registrations-body');
  const emptyEl = document.getElementById('registrations-empty');
  const table = document.getElementById('registrations-table');
  tbody.innerHTML = '';

  let filtered = teams;

  // Filter by dept
  if (filterDept !== 'all') {
    filtered = filtered.filter((t) => t.department === filterDept);
  }

  // Search
  if (searchQuery) {
    filtered = filtered.filter((t) => {
      const searchable = `${t.leaderName} ${t.usn} ${t.email} ${t.phone} ${(t.members || []).join(' ')}`.toLowerCase();
      return searchable.includes(searchQuery);
    });
  }

  if (filtered.length === 0) {
    emptyEl.style.display = 'block';
    table.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  table.style.display = '';

  filtered.forEach((team, i) => {
    const ps = getSelectedPS(team.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td class="leader-cell">${team.leaderName}</td>
      <td>${team.usn || '—'}</td>
      <td>${team.email}</td>
      <td>${team.phone || '—'}</td>
      <td>${DEPT_NAMES[team.department] || team.department}</td>
      <td class="members-cell">${team.members ? team.members.join(', ') : '—'}</td>
      <td class="ps-cell">${ps ? `<span class="ps-tag selected">${ps.title}</span>` : '<span class="ps-tag pending">Not selected</span>'}</td>
      <td>${formatDate(team.registeredAt)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ═════════════════════════════════════════
//  PROBLEM STATEMENTS TAB
// ═════════════════════════════════════════
let activeDept = 'cse';

// Dept chip click
document.getElementById('ps-dept-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.dept-chip');
  if (!chip) return;
  document.querySelectorAll('.dept-chip').forEach((c) => c.classList.remove('active'));
  chip.classList.add('active');
  activeDept = chip.dataset.dept;
  renderPSList();
});

// Add PS
document.getElementById('btn-add-ps').addEventListener('click', () => {
  const title = document.getElementById('new-ps-title').value.trim();
  const desc = document.getElementById('new-ps-desc').value.trim();
  const diff = document.getElementById('new-ps-diff').value;

  if (!title) return;

  const allPS = getAllPS();
  if (!allPS[activeDept]) allPS[activeDept] = [];

  const id = `${activeDept}-${Date.now()}`;
  allPS[activeDept].push({ id, title, desc: desc || 'No description provided.', difficulty: diff });
  saveCustomPS(allPS);

  // Clear form
  document.getElementById('new-ps-title').value = '';
  document.getElementById('new-ps-desc').value = '';
  document.getElementById('new-ps-diff').value = 'Medium';

  renderPSList();
  renderOverview();
});

function renderPSList() {
  const allPS = getAllPS();
  const problems = allPS[activeDept] || [];
  const psList = document.getElementById('ps-list');
  psList.innerHTML = '';

  // Find which PS are taken
  const teams = getTeams();
  const takenMap = {};
  teams.forEach((team) => {
    const ps = getSelectedPS(team.id);
    if (ps) takenMap[ps.id] = team.leaderName;
  });

  if (problems.length === 0) {
    psList.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-tertiary);">
        <p>No problem statements for this department yet.</p>
      </div>
    `;
    return;
  }

  problems.forEach((ps, i) => {
    const isTaken = takenMap[ps.id];
    const item = document.createElement('div');
    item.className = 'ps-item';

    const diffBadge = `badge-${ps.difficulty.toLowerCase()}`;

    item.innerHTML = `
      <div class="ps-item-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="ps-item-body">
        <div class="ps-item-title">${ps.title}</div>
        <div class="ps-item-desc">${ps.desc}</div>
      </div>
      <div class="ps-item-meta">
        <span class="badge ${diffBadge}">${ps.difficulty}</span>
        ${isTaken ? `<span class="ps-taken-tag">Taken by ${isTaken}</span>` : ''}
        <button class="btn-delete-ps" data-id="${ps.id}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    psList.appendChild(item);
  });

  // Delete handlers
  psList.querySelectorAll('.btn-delete-ps').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const allPS = getAllPS();
      if (allPS[activeDept]) {
        allPS[activeDept] = allPS[activeDept].filter((p) => p.id !== id);
        saveCustomPS(allPS);
        renderPSList();
        renderOverview();
      }
    });
  });
}

// ─── INIT ───
renderOverview();
