/* ═══════════════════════════════════════════════
   HackVerse — Dashboard Logic
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';
import { requireAuth, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  // Welcome
  document.getElementById('welcome-name').textContent = session.leaderName.split(' ')[0];
  document.getElementById('welcome-dept').textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  // Async data loading
  async function loadDashboardData() {
    const selectedPS = await getSelectedPS(session.teamId);

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
        document.getElementById('chosen-ps-dept').textContent = DEPT_NAMES[selectedPS.department] || selectedPS.department;
      }
    }
    
    loadWeeklyReports();
  }

  async function loadWeeklyReports() {
    const list = document.getElementById('reports-list');
    const msg = document.getElementById('no-reports-msg');
    
    if (!list) return;

    const { data: reports, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('team_id', session.teamId)
      .order('week_number', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    if (reports && reports.length > 0) {
      if (msg) msg.style.display = 'none';
      list.innerHTML = '';
      reports.forEach(r => {
        const item = document.createElement('div');
        item.style.padding = '12px';
        item.style.marginBottom = '10px';
        item.style.borderRadius = '8px';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.border = '1px solid var(--border-subtle)';
        
        let statusColor = '#ff6a00';
        let statusBg = 'rgba(255,106,0,0.1)';
        if (r.mentor_status === 'Approved') { statusColor = 'var(--accent-green)'; statusBg = 'rgba(0,228,159,0.1)'; }
        if (r.mentor_status === 'Needs Revision') { statusColor = 'var(--accent-pink)'; statusBg = 'rgba(255,0,228,0.1)'; }

        item.innerHTML = `
          <div style="display:flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color:var(--accent-cyan);">Week ${r.week_number}</strong>
            <span style="font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: ${statusBg}; color: ${statusColor}; text-transform: uppercase;">${r.mentor_status}</span>
          </div>
          <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:0;">${r.report_text}</p>
          ${r.mentor_comment ? `<div style="font-size:0.8rem; margin-top:10px; border-top:1px solid var(--border-subtle); padding-top:6px; color:var(--text-primary);"><strong style="color:var(--accent-yellow);">Mentor:</strong> ${r.mentor_comment}</div>` : ''}
        `;
        list.appendChild(item);
      });
    } else {
      list.innerHTML = '';
      if (msg) list.appendChild(msg);
      if (msg) msg.style.display = 'block';
    }
  }

  const submitReportBtn = document.getElementById('submit-report-btn');
  if (submitReportBtn) {
    submitReportBtn.addEventListener('click', async () => {
      const week = parseInt(document.getElementById('report-week').value);
      const text = document.getElementById('report-text').value.trim();

      if (!week || !text) {
        alert('Please provide a valid week number and report content.');
        return;
      }

      submitReportBtn.textContent = 'Submitting...';
      submitReportBtn.disabled = true;

      const { error } = await supabase
        .from('weekly_reports')
        .insert([{ team_id: session.teamId, week_number: week, report_text: text }]);

      submitReportBtn.textContent = 'Submit Report';
      submitReportBtn.disabled = false;

      if (error) {
        if (error.code === '23505') alert('You have already submitted a report for Week ' + week);
        else alert('Failed to submit report. Please try again.');
      } else {
        document.getElementById('report-week').value = '';
        document.getElementById('report-text').value = '';
        alert('Weekly progress report submitted successfully!');
        loadWeeklyReports();
      }
    });
  }

  loadDashboardData();

  // Team list (fetch fresh from Supabase to ensure updated names reflect)
  const teamList = document.getElementById('team-list');
  const colors = [
    'linear-gradient(135deg, #FF00E4, #33CCFF)',
    'linear-gradient(135deg, #33CCFF, #FFD700)',
    'linear-gradient(135deg, #FFD700, #00E49F)',
    'linear-gradient(135deg, #00E49F, #A855F7)',
  ];

  async function loadTeamMembers() {
    if (!teamList) return;

    const { data: members, error } = await supabase
      .from('team_members')
      .select('member_name, member_index')
      .eq('team_id', session.teamId)
      .order('member_index');

    if (error || !members) {
      console.error('Error fetching team members:', error);
      return;
    }

    teamList.innerHTML = '';
    members.forEach((m, i) => {
      const isNull = m.member_name === 'null';
      const displayName = isNull ? 'No Name Provided' : m.member_name;
      const initial = (!isNull && m.member_name) ? m.member_name.charAt(0).toUpperCase() : '?';
      const nameStyle = isNull ? 'color: var(--text-tertiary); font-style: italic;' : '';

      const row = document.createElement('div');
      row.className = 'team-member-row';
      row.innerHTML = `
        <div class="member-avatar" style="background: ${colors[i]}; color: white;">${initial}</div>
        <span class="member-name" style="${nameStyle}">${displayName}</span>
        <span class="member-badge ${i === 0 ? 'leader' : 'member'}">${i === 0 ? '★ Leader' : 'Member'}</span>
      `;
      teamList.appendChild(row);
    });
  }

  loadTeamMembers();

  // Panel info
  const panelDept = document.getElementById('panel-dept');
  if (panelDept) panelDept.textContent = DEPT_NAMES[session.department] || session.departmentLabel;

  const panelEmail = document.getElementById('panel-email');
  if (panelEmail) panelEmail.textContent = session.email;

  const panelDate = document.getElementById('panel-date');
  if (panelDate) panelDate.textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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
