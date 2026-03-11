/* ═══════════════════════════════════════════════
   HackVerse — Dashboard Logic (refactored)
   ═══════════════════════════════════════════════ */

import { requireAuth, getTeamData, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  const team = getTeamData(session);

  initAppNav(session);

  // Welcome
  document.getElementById('welcome-name').textContent = session.leaderName.split(' ')[0];
  document.getElementById('welcome-dept').textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  // Check selected PS
  const selectedPS = getSelectedPS(session.teamId);
  if (selectedPS) {
    document.getElementById('ps-status').textContent = 'Selected';
    document.getElementById('ps-status').style.color = 'var(--accent-green)';

    // Timeline
    const stepPS = document.getElementById('step-ps');
    if (stepPS) {
      stepPS.classList.add('completed');
      const badge = document.getElementById('ps-badge');
      if (badge) { badge.textContent = '✓'; badge.className = 'timeline-check'; }
      const desc = document.getElementById('ps-desc');
      if (desc) desc.textContent = selectedPS.title;
    }

    const stepSubmit = document.getElementById('step-submit');
    if (stepSubmit) {
      stepSubmit.classList.add('active');
      const sBadge = stepSubmit.querySelector('.timeline-status');
      if (sBadge) { sBadge.textContent = 'In Progress'; sBadge.classList.add('active-badge'); }
    }

    const psCard = document.getElementById('selected-ps');
    if (psCard) {
      psCard.style.display = 'block';
      document.getElementById('chosen-ps-title').textContent = selectedPS.title;
      document.getElementById('chosen-ps-dept').textContent = selectedPS.department;
    }
  }

  // Team list
  const teamList = document.getElementById('team-list');
  const colors = [
    'linear-gradient(135deg, #FF00E4, #33CCFF)',
    'linear-gradient(135deg, #33CCFF, #FFD700)',
    'linear-gradient(135deg, #FFD700, #00E49F)',
    'linear-gradient(135deg, #00E49F, #A855F7)',
  ];

  if (team && team.members && teamList) {
    team.members.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'team-member-row';
      row.innerHTML = `
        <div class="member-avatar" style="background: ${colors[i]}; color: white;">${name.charAt(0).toUpperCase()}</div>
        <span class="member-name">${name}</span>
        <span class="member-badge ${i === 0 ? 'leader' : 'member'}">${i === 0 ? '★ Leader' : 'Member'}</span>
      `;
      teamList.appendChild(row);
    });
  }

  // Panel info
  const panelDept = document.getElementById('panel-dept');
  if (panelDept) panelDept.textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  const panelEmail = document.getElementById('panel-email');
  if (panelEmail) panelEmail.textContent = session.email;

  if (team && team.registeredAt) {
    const d = new Date(team.registeredAt);
    const panelDate = document.getElementById('panel-date');
    if (panelDate) panelDate.textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Ambient particles
  function initParticles() {
    const canvas = document.getElementById('dash-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    const particles = [];
    const clrs = ['rgba(255,0,228,0.15)', 'rgba(51,204,255,0.15)', 'rgba(255,215,0,0.12)', 'rgba(0,228,159,0.1)'];

    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    function create() { return { x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2, dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3, color: clrs[Math.floor(Math.random() * clrs.length)] }; }
    function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
      });
    }
    resize();
    for (let i = 0; i < 60; i++) particles.push(create());
    animate();
    window.addEventListener('resize', resize);
  }

  initParticles();
}
