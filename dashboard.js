/* ═══════════════════════════════════════════════
   HackVerse — Dashboard Logic
   ═══════════════════════════════════════════════ */

// ─── SESSION CHECK ───
const session = JSON.parse(localStorage.getItem('hackverse_session'));
if (!session) {
  window.location.href = '/login.html';
}

// ─── GET FULL TEAM DATA ───
function getTeamData() {
  const teams = JSON.parse(localStorage.getItem('hackverse_teams') || '[]');
  return teams.find((t) => t.id === session.teamId) || null;
}

const team = getTeamData();

// ─── POPULATE DASHBOARD ───
function populateDashboard() {
  if (!session || !team) return;

  // Nav user info
  const initials = session.leaderName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  document.getElementById('nav-avatar').textContent = initials;
  document.getElementById('nav-user-name').textContent = session.leaderName;
  document.getElementById('nav-user-dept').textContent = session.departmentLabel || session.department;

  // Welcome
  document.getElementById('welcome-name').textContent = session.leaderName.split(' ')[0];
  document.getElementById('welcome-dept').textContent = session.departmentLabel || session.department;

  // Check if a problem statement has been selected
  const selectedPS = JSON.parse(localStorage.getItem('hackverse_selected_ps_' + session.teamId) || 'null');
  if (selectedPS) {
    document.getElementById('ps-status').textContent = 'Selected';
    document.getElementById('ps-status').style.color = 'var(--accent-green)';

    // Update timeline
    const stepPS = document.getElementById('step-ps');
    stepPS.classList.add('completed');
    document.getElementById('ps-badge').textContent = '✓';
    document.getElementById('ps-badge').className = 'timeline-check';
    document.getElementById('ps-desc').textContent = selectedPS.title;

    // Show the selected PS card
    const psCard = document.getElementById('selected-ps');
    psCard.style.display = 'block';
    document.getElementById('chosen-ps-title').textContent = selectedPS.title;
    document.getElementById('chosen-ps-dept').textContent = selectedPS.department;

    // Make "submit" step active
    const stepSubmit = document.getElementById('step-submit');
    stepSubmit.classList.add('active');
    const submitBadge = stepSubmit.querySelector('.timeline-status');
    submitBadge.textContent = 'In Progress';
    submitBadge.classList.add('active-badge');
  }

  // Team list
  const teamList = document.getElementById('team-list');
  const memberColors = [
    'linear-gradient(135deg, #FF00E4, #33CCFF)',
    'linear-gradient(135deg, #33CCFF, #FFD700)',
    'linear-gradient(135deg, #FFD700, #00E49F)',
    'linear-gradient(135deg, #00E49F, #A855F7)',
  ];

  if (team && team.members) {
    team.members.forEach((name, idx) => {
      const row = document.createElement('div');
      row.className = 'team-member-row';

      const initial = name.trim().charAt(0).toUpperCase();

      row.innerHTML = `
        <div class="member-avatar" style="background: ${memberColors[idx]}; color: white;">${initial}</div>
        <span class="member-name">${name}</span>
        <span class="member-badge ${idx === 0 ? 'leader' : 'member'}">${idx === 0 ? '★ Leader' : 'Member'}</span>
      `;
      teamList.appendChild(row);
    });
  }

  // Panel footer info
  document.getElementById('panel-dept').textContent = session.departmentLabel || session.department;
  document.getElementById('panel-email').textContent = session.email;

  if (team && team.registeredAt) {
    const d = new Date(team.registeredAt);
    document.getElementById('panel-date').textContent = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

// ─── LOGOUT ───
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('hackverse_session');
  window.location.href = '/';
});

// ─── AMBIENT PARTICLES ───
function initParticles() {
  const canvas = document.getElementById('dash-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const colors = ['rgba(255,0,228,0.15)', 'rgba(51,204,255,0.15)', 'rgba(255,215,0,0.12)', 'rgba(0,228,159,0.1)'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  function init() {
    resize();
    for (let i = 0; i < 60; i++) particles.push(createParticle());
  }

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, w, h);

    particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
  }

  init();
  animate();
  window.addEventListener('resize', resize);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  populateDashboard();
  initParticles();
});
