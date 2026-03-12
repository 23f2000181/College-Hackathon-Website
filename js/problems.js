/* ═══════════════════════════════════════════════
   HackVerse — Problem Statements Page Logic
   ═══════════════════════════════════════════════ */

import {
  requireAuth,
  getSelectedPS,
  selectPS,
  deselectPS,
  getProblemsByDept,
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

  // ─── Preparation Help Links (per department) ───
  const PREP_COURSES = {
    'cse': {
      topic: 'Learn App Development',
      url: 'https://www.udemy.com/course/creating-a-quiz-game-app-from-scratch-android-studio/',
    },
    'ise': {
      topic: 'Learn Web Development Basics',
      url: 'https://www.udemy.com/course/html-css-mastery-2025/',
    },
    'cse-aiml': {
      topic: 'Learn Agentic AI',
      url: 'https://www.udemy.com/course/agentic-minds-crew-ai/',
    },
    'cse-ds': {
      topic: 'Learn Agentic AI',
      url: 'https://www.udemy.com/course/agentic-minds-crew-ai/',
    },
    'ece': {
      topic: 'Learn Circuit Design',
      url: 'https://www.udemy.com/course/digital-circuit-design-and-implementation/',
    },
    // CIVIL and MECH — links TBD
    // 'civil': { topic: '...', url: '...' },
    // 'mech': { topic: '...', url: '...' },
  };

  const prepCourse = PREP_COURSES[dept];
  const prepBanner = document.getElementById('prep-banner');
  if (prepCourse && prepBanner) {
    document.getElementById('prep-topic').textContent = prepCourse.topic;
    document.getElementById('prep-link').href = prepCourse.url;
    prepBanner.style.display = '';
  }

  async function renderProblems() {
    const grid = document.getElementById('problems-grid');
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);">Loading...</div>';

    // Fetch problems from Supabase
    const allProblems = await getProblemsByDept(dept);
    const currentPS = await getSelectedPS(session.teamId);

    grid.innerHTML = '';

    // Filter: hide problems taken by OTHER teams (show own selection)
    const availableProblems = allProblems.filter(
      (ps) => !ps.selected_by || ps.selected_by === session.teamId
    );

    if (availableProblems.length === 0) {
      grid.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-tertiary);">
          <div style="font-size: 3rem; margin-bottom: 16px;">😔</div>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">All Problem Statements Taken</h3>
          <p style="font-size: 0.9rem;">All problems in your department have been selected by other teams.</p>
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
          <p class="problem-desc">${ps.description}</p>
        </div>
        <div class="problem-actions">
          <button class="btn-select${isSelected ? ' selected' : ''}" data-id="${ps.id}">
            ${isSelected ? '✓ Selected' : 'Select'}
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    // Show taken count
    const takenCount = allProblems.filter(
      (ps) => ps.selected_by && ps.selected_by !== session.teamId
    ).length;
    if (takenCount > 0) {
      const notice = document.createElement('div');
      notice.className = 'taken-notice';
      notice.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>${takenCount} problem${takenCount > 1 ? 's' : ''} already selected by other teams — not shown</span>
      `;
      grid.appendChild(notice);
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
      btn.addEventListener('click', async () => {
        const psTitle = allProblems.find((p) => p.id === btn.dataset.id)?.title || 'this problem';
        const confirmed = confirm(
          `Are you sure you want to select "${psTitle}"?\n\nOnce selected, other teams won't be able to choose this problem statement. If another team selects a different PS while you decide, it will no longer be available to you.`
        );
        if (!confirmed) return;

        btn.textContent = '...';
        btn.disabled = true;
        const success = await selectPS(session.teamId, btn.dataset.id);
        if (success) {
          showToast(`Selected: ${psTitle}`, 'success');
          renderProblems();
        } else {
          showToast('Failed to select problem statement', 'error');
          btn.textContent = 'Select';
          btn.disabled = false;
        }
      });
    });
  }

  // Deselect button
  document.getElementById('btn-deselect').addEventListener('click', async () => {
    await deselectPS(session.teamId);
    showToast('Problem statement deselected', 'error');
    renderProblems();
  });

  renderProblems();
}
