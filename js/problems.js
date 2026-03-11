/* ═══════════════════════════════════════════════
   HackVerse — Problem Statements Page Logic
   ═══════════════════════════════════════════════ */

import {
  requireAuth,
  getSelectedPS,
  selectPS,
  getTakenPSIds,
  getActivePS,
  initAppNav,
  showToast,
  DEPT_NAMES,
} from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  const dept = session.department;
  const deptName = DEPT_NAMES[dept] || session.departmentLabel;
  document.getElementById('dept-display').textContent = deptName;

  const activePS = getActivePS();
  const allProblems = activePS[dept] || [];
  let currentPS = getSelectedPS(session.teamId);

  function renderProblems() {
    const grid = document.getElementById('problems-grid');
    grid.innerHTML = '';

    // Get IDs already taken by OTHER teams
    const takenIds = getTakenPSIds(session.teamId);

    // Filter: show only problems that are NOT taken by others
    // (but always show the current team's own selection)
    const availableProblems = allProblems.filter(
      (ps) => !takenIds.includes(ps.id) || (currentPS && currentPS.id === ps.id)
    );

    if (availableProblems.length === 0) {
      grid.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-tertiary);">
          <div style="font-size: 3rem; margin-bottom: 16px;">😔</div>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">All Problem Statements Taken</h3>
          <p style="font-size: 0.9rem;">All problems in your department have been selected by other teams. Check back later if any become available.</p>
        </div>
      `;
      return;
    }

    let visibleIndex = 0;
    availableProblems.forEach((ps) => {
      visibleIndex++;
      const isSelected = currentPS && currentPS.id === ps.id;

      const card = document.createElement('div');
      card.className = `problem-card${isSelected ? ' is-selected' : ''}`;

      const diffClass = `badge-${ps.difficulty.toLowerCase()}`;

      card.innerHTML = `
        <div class="problem-number">${String(visibleIndex).padStart(2, '0')}</div>
        <div class="problem-body">
          <div class="problem-meta">
            <span class="badge ${diffClass}">${ps.difficulty}</span>
            <span class="problem-id">${ps.id}</span>
          </div>
          <h3 class="problem-title">${ps.title}</h3>
          <p class="problem-desc">${ps.desc}</p>
        </div>
        <div class="problem-actions">
          <button class="btn-select${isSelected ? ' selected' : ''}" data-id="${ps.id}">
            ${isSelected ? '✓ Selected' : 'Select'}
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    // Show taken count if any are hidden
    if (takenIds.length > 0) {
      const takenInDept = allProblems.filter((ps) => takenIds.includes(ps.id)).length;
      if (takenInDept > 0) {
        const notice = document.createElement('div');
        notice.className = 'taken-notice';
        notice.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>${takenInDept} problem${takenInDept > 1 ? 's' : ''} already selected by other teams — not shown</span>
        `;
        grid.appendChild(notice);
      }
    }

    // Selection banner
    const banner = document.getElementById('current-selection');
    if (currentPS) {
      banner.style.display = 'flex';
      document.getElementById('selection-title').textContent = currentPS.title;
    } else {
      banner.style.display = 'none';
    }

    // Button listeners
    grid.querySelectorAll('.btn-select:not(.selected)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const ps = allProblems.find((p) => p.id === id);
        if (ps) {
          currentPS = { ...ps, department: deptName };
          selectPS(session.teamId, currentPS);
          renderProblems();
          showToast(`Selected: ${ps.title}`, 'success');
        }
      });
    });
  }

  // Deselect button
  document.getElementById('btn-deselect').addEventListener('click', () => {
    currentPS = null;
    localStorage.removeItem('hackverse_selected_ps_' + session.teamId);
    renderProblems();
    showToast('Problem statement deselected', 'error');
  });

  renderProblems();
}

