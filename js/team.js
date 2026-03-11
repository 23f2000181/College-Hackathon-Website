/* ═══════════════════════════════════════════════
   HackVerse — Team Details Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getTeamData, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  // Leader info (from session)
  document.getElementById('leader-name').textContent = session.leaderName;
  document.getElementById('leader-usn').textContent = session.usn || '—';
  document.getElementById('leader-email').textContent = session.email;
  document.getElementById('leader-phone').textContent = session.phone || '—';
  document.getElementById('leader-dept').textContent = DEPT_NAMES[session.department] || session.departmentLabel;
  document.getElementById('leader-dept-full').textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  const leaderAvatar = document.getElementById('leader-avatar');
  if (leaderAvatar) {
    leaderAvatar.textContent = session.leaderName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Fetch full team data from Supabase for registered date
  async function loadTeamData() {
    const team = await getTeamData(session.teamId);
    if (team && team.registered_at) {
      const d = new Date(team.registered_at);
      document.getElementById('leader-date').textContent = d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }
  }
  loadTeamData();

  // Team roster (from session)
  const rosterEl = document.getElementById('roster-list');
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
    const noPS = document.getElementById('no-ps');
    const psDetail = document.getElementById('selected-ps-detail');
    const psTitle = document.getElementById('ps-title');
    const psDesc = document.getElementById('ps-desc');
    const psBadge = document.getElementById('ps-diff-badge');
    const psId = document.getElementById('ps-id');

    if (ps) {
      if (noPS) noPS.style.display = 'none';
      if (psDetail) psDetail.style.display = '';
      if (psTitle) psTitle.textContent = ps.title;
      if (psDesc) psDesc.textContent = ps.description;
      if (psId) psId.textContent = ps.id;
      if (psBadge) {
        psBadge.textContent = ps.difficulty;
        psBadge.className = `ps-selected-tag badge-${ps.difficulty.toLowerCase()}`;
      }
    } else {
      if (noPS) noPS.style.display = '';
      if (psDetail) psDetail.style.display = 'none';
    }
  }

  loadSelectedPS();
}
