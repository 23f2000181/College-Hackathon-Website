/* ═══════════════════════════════════════════════
   HackVerse — Team Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getTeamData, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  const team = getTeamData(session);

  initAppNav(session);

  // Leader card
  const initials = session.leaderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('leader-avatar').textContent = initials;
  document.getElementById('leader-name').textContent = session.leaderName;
  document.getElementById('leader-dept').textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  if (team) {
    document.getElementById('leader-usn').textContent = team.usn;
    document.getElementById('leader-email').textContent = team.email;
    document.getElementById('leader-phone').textContent = team.phone;
    document.getElementById('leader-dept-full').textContent = DEPT_NAMES[team.department] || team.departmentLabel;

    if (team.registeredAt) {
      const d = new Date(team.registeredAt);
      document.getElementById('leader-date').textContent = d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    }

    // Roster
    const rosterList = document.getElementById('roster-list');
    const colors = [
      'linear-gradient(135deg, #FF00E4, #33CCFF)',
      'linear-gradient(135deg, #33CCFF, #FFD700)',
      'linear-gradient(135deg, #FFD700, #00E49F)',
      'linear-gradient(135deg, #00E49F, #A855F7)',
    ];

    team.members.forEach((name, i) => {
      const item = document.createElement('div');
      item.className = 'roster-item';
      item.innerHTML = `
        <div class="roster-avatar" style="background: ${colors[i]};">${name.charAt(0).toUpperCase()}</div>
        <span class="roster-name">${name}</span>
        <span class="roster-role ${i === 0 ? 'leader' : 'member'}">${i === 0 ? '★ Leader' : 'Member'}</span>
      `;
      rosterList.appendChild(item);
    });

    document.getElementById('team-count-badge').textContent = `${team.members.length} Members`;
  }

  // Selected PS
  const selectedPS = getSelectedPS(session.teamId);
  if (selectedPS) {
    document.getElementById('no-ps').style.display = 'none';
    const det = document.getElementById('selected-ps-detail');
    det.style.display = 'block';

    document.getElementById('ps-title').textContent = selectedPS.title;
    document.getElementById('ps-desc').textContent = selectedPS.desc;
    document.getElementById('ps-id').textContent = selectedPS.id;

    const diffBadge = document.getElementById('ps-diff-badge');
    diffBadge.textContent = selectedPS.difficulty;
    diffBadge.className = `ps-selected-tag badge badge-${selectedPS.difficulty.toLowerCase()}`;
  }
}
