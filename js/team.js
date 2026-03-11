/* ═══════════════════════════════════════════════
   HackVerse — Team Details Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  // Leader info (from session)
  document.getElementById('leader-name').textContent = session.leaderName;
  document.getElementById('leader-usn').textContent = session.usn || '—';
  document.getElementById('leader-email').textContent = session.email;
  document.getElementById('leader-phone').textContent = session.phone || '—';
  document.getElementById('leader-dept').textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  const leaderAvatar = document.getElementById('leader-avatar');
  if (leaderAvatar) {
    leaderAvatar.textContent = session.leaderName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Team roster (from session)
  const rosterEl = document.getElementById('team-roster');
  const colors = [
    'linear-gradient(135deg, #FF00E4, #33CCFF)',
    'linear-gradient(135deg, #33CCFF, #FFD700)',
    'linear-gradient(135deg, #FFD700, #00E49F)',
    'linear-gradient(135deg, #00E49F, #A855F7)',
  ];

  if (session.members && rosterEl) {
    session.members.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'roster-item';
      li.innerHTML = `
        <div class="roster-avatar" style="background: ${colors[i]}; color: white;">${name.charAt(0).toUpperCase()}</div>
        <div class="roster-info">
          <span class="roster-name">${name}</span>
          <span class="roster-role">${i === 0 ? '★ Team Leader' : `Member ${i + 1}`}</span>
        </div>
      `;
      rosterEl.appendChild(li);
    });
  }

  // Selected PS (async from Supabase)
  async function loadSelectedPS() {
    const ps = await getSelectedPS(session.teamId);
    const psSection = document.getElementById('selected-ps-section');
    const psTitle = document.getElementById('ps-title');
    const psDesc = document.getElementById('ps-desc');
    const psBadge = document.getElementById('ps-badge');

    if (ps) {
      if (psTitle) psTitle.textContent = ps.title;
      if (psDesc) psDesc.textContent = ps.description;
      if (psBadge) {
        psBadge.textContent = ps.difficulty;
        psBadge.className = `badge badge-${ps.difficulty.toLowerCase()}`;
      }
      if (psSection) psSection.style.display = '';
    } else {
      if (psSection) {
        psSection.innerHTML = `
          <div style="text-align:center; padding: 40px; color: var(--text-tertiary);">
            <p>No problem statement selected yet.</p>
            <a href="/pages/problems.html" style="color: var(--accent-cyan); text-decoration: underline; margin-top: 8px; display: inline-block;">Browse Problem Statements →</a>
          </div>
        `;
      }
    }
  }

  loadSelectedPS();
}
