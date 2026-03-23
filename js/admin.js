/* ═══════════════════════════════════════════════
   HackVerse — Admin Panel Logic
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';
import { DEPT_NAMES } from '/js/shared.js';

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

    if (tab.dataset.tab === 'overview') renderOverview();
    if (tab.dataset.tab === 'registrations') renderRegistrations();
    if (tab.dataset.tab === 'problems') renderPSList();
    if (tab.dataset.tab === 'mentors') renderMentors();
  });
});

// ═════════════════════════════════════════
//  OVERVIEW TAB
// ═════════════════════════════════════════
async function renderOverview() {
  // Fetch teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('registered_at', { ascending: false });

  const allTeams = teams || [];

  // Fetch PS stats
  const { data: allPS } = await supabase
    .from('problem_statements')
    .select('id, selected_by');

  const psList = allPS || [];
  const psSelectedCount = psList.filter((p) => p.selected_by).length;

  // Stats
  document.getElementById('stat-teams').textContent = allTeams.length;
  document.getElementById('stat-participants').textContent = allTeams.length * 4;
  document.getElementById('stat-ps-selected').textContent = psSelectedCount;
  document.getElementById('stat-total-ps').textContent = psList.length;

  // Dept breakdown
  const deptCounts = {};
  Object.keys(DEPT_NAMES).forEach((k) => (deptCounts[k] = 0));
  allTeams.forEach((t) => {
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

  if (allTeams.length === 0) {
    recentEmpty.style.display = 'block';
    document.getElementById('recent-table').style.display = 'none';
  } else {
    recentEmpty.style.display = 'none';
    document.getElementById('recent-table').style.display = '';

    allTeams.slice(0, 5).forEach((team) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="leader-cell">${team.leader_name}</td>
        <td>${DEPT_NAMES[team.department] || team.department}</td>
        <td><span style="font-size:0.78rem;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(99,102,241,0.12);color:#818cf8;">${team.academic_year || '—'}</span></td>
        <td>4</td>
        <td>${formatDate(team.registered_at)}</td>
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

async function renderRegistrations() {
  let query = supabase.from('teams').select('*').order('registered_at', { ascending: false });

  if (filterDept !== 'all') {
    query = query.eq('department', filterDept);
  }

  const { data: teams } = await query;
  const allTeams = teams || [];

  // Also fetch all PS to show selected status
  const { data: allPS } = await supabase
    .from('problem_statements')
    .select('id, title, selected_by');

  // Also fetch all members
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('team_id, member_name, member_index')
    .order('member_index');

  const psByTeam = {};
  (allPS || []).forEach((ps) => {
    if (ps.selected_by) psByTeam[ps.selected_by] = ps;
  });

  const membersByTeam = {};
  (allMembers || []).forEach((m) => {
    if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
    membersByTeam[m.team_id].push(m.member_name);
  });

  const tbody = document.getElementById('registrations-body');
  const emptyEl = document.getElementById('registrations-empty');
  const table = document.getElementById('registrations-table');
  tbody.innerHTML = '';

  // Search filter
  let filtered = allTeams;
  if (searchQuery) {
    filtered = filtered.filter((t) => {
      const members = membersByTeam[t.id] || [];
      const searchable = `${t.leader_name} ${t.usn} ${t.email} ${t.phone} ${members.join(' ')}`.toLowerCase();
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
    const ps = psByTeam[team.id];
    const members = membersByTeam[team.id] || [];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td class="leader-cell">${team.leader_name}</td>
      <td>${team.usn || '—'}</td>
      <td>${team.email}</td>
      <td>${team.phone || '—'}</td>
      <td>${DEPT_NAMES[team.department] || team.department}</td>
      <td><span style="font-size:0.78rem;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(99,102,241,0.12);color:#818cf8;">${team.academic_year || '—'}</span></td>
      <td class="members-cell">${members.join(', ') || '—'}</td>
      <td class="ps-cell">${ps ? `<span class="ps-tag selected">${ps.title}</span>` : '<span class="ps-tag pending">Not selected</span>'}</td>
      <td>${formatDate(team.registered_at)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit btn-edit-team" data-id="${team.id}" title="Edit Team">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action btn-delete btn-delete-team" data-id="${team.id}" title="Delete Team">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Registrations Edit & Delete Handlers
document.getElementById('registrations-body').addEventListener('click', async (e) => {
  const btnEdit = e.target.closest('.btn-edit-team');
  if (btnEdit) {
    const id = btnEdit.dataset.id;
    const { data: teamData } = await supabase.from('teams').select('*').eq('id', id).single();
    if (!teamData) return;
    
    const { data: members } = await supabase.from('team_members').select('*').eq('team_id', id).order('member_index');
    
    document.getElementById('edit-team-id').value = teamData.id;
    document.getElementById('edit-team-leader').value = teamData.leader_name;
    document.getElementById('edit-team-usn').value = teamData.usn || '';
    document.getElementById('edit-team-email').value = teamData.email;
    document.getElementById('edit-team-phone').value = teamData.phone || '';
    document.getElementById('edit-team-dept').value = teamData.department;
    document.getElementById('edit-team-year').value = teamData.academic_year || '';
    
    const memContainer = document.getElementById('edit-team-members');
    memContainer.innerHTML = '';
    (members || []).forEach(m => {
      memContainer.innerHTML += `
        <div class="form-row member-edit-row" data-id="${m.id}" style="margin-bottom: 8px;">
          <input type="text" class="admin-input mem-name" value="${m.member_name}" placeholder="Member ${m.member_index} Name" />
          <input type="text" class="admin-input mem-usn" value="${m.usn || ''}" placeholder="Member ${m.member_index} USN" />
        </div>
      `;
    });
    
    document.getElementById('modal-edit-team').classList.add('active');
  }

  const btnDel = e.target.closest('.btn-delete-team');
  if (btnDel) {
    const id = btnDel.dataset.id;
    if (!confirm('Are you sure you want to delete this team? All associated members and assignments will also be deleted.')) return;
    
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) {
      alert('Error deleting team: ' + error.message);
    } else {
      renderRegistrations();
      renderOverview();
    }
  }
});

document.getElementById('btn-save-team').addEventListener('click', async () => {
  const id = document.getElementById('edit-team-id').value;
  const btn = document.getElementById('btn-save-team');
  btn.textContent = 'Saving...';
  
  await supabase.from('teams').update({
    leader_name: document.getElementById('edit-team-leader').value,
    usn: document.getElementById('edit-team-usn').value,
    email: document.getElementById('edit-team-email').value,
    phone: document.getElementById('edit-team-phone').value,
    department: document.getElementById('edit-team-dept').value,
    academic_year: document.getElementById('edit-team-year').value,
  }).eq('id', id);
  
  const memberRows = document.querySelectorAll('.member-edit-row');
  for (const row of memberRows) {
    const memId = row.dataset.id;
    const memName = row.querySelector('.mem-name').value;
    const memUsn = row.querySelector('.mem-usn').value;
    await supabase.from('team_members').update({
      member_name: memName,
      usn: memUsn
    }).eq('id', memId);
  }
  
  btn.textContent = 'Save Changes';
  document.getElementById('modal-edit-team').classList.remove('active');
  renderRegistrations();
});

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
document.getElementById('btn-add-ps').addEventListener('click', async () => {
  const title = document.getElementById('new-ps-title').value.trim();
  const desc = document.getElementById('new-ps-desc').value.trim();
  const diff = document.getElementById('new-ps-diff').value;

  if (!title) return;

  const id = `${activeDept}-${Date.now()}`;
  const { error } = await supabase
    .from('problem_statements')
    .insert({
      id,
      department: activeDept,
      title,
      description: desc || 'No description provided.',
      difficulty: diff,
    });

  if (error) {
    alert('Error adding PS: ' + error.message);
    return;
  }

  // Clear form
  document.getElementById('new-ps-title').value = '';
  document.getElementById('new-ps-desc').value = '';
  document.getElementById('new-ps-diff').value = 'Medium';

  renderPSList();
  renderOverview();
});

async function renderPSList() {
  const { data: problems } = await supabase
    .from('problem_statements')
    .select('*, teams:selected_by(leader_name)')
    .eq('department', activeDept)
    .order('id');

  const psList = document.getElementById('ps-list');
  psList.innerHTML = '';

  const items = problems || [];

  if (items.length === 0) {
    psList.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-tertiary);">
        <p>No problem statements for this department yet.</p>
      </div>
    `;
    return;
  }

  items.forEach((ps, i) => {
    const takenBy = ps.teams?.leader_name;
    const item = document.createElement('div');
    item.className = 'ps-item';

    const diffBadge = `badge-${ps.difficulty.toLowerCase()}`;

    item.innerHTML = `
      <div class="ps-item-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="ps-item-body">
        <div class="ps-item-title">${ps.title}</div>
        <div class="ps-item-desc">${ps.description}</div>
      </div>
      <div class="ps-item-meta">
        <span class="badge ${diffBadge}">${ps.difficulty}</span>
        ${takenBy ? `<span class="ps-taken-tag">Taken by ${takenBy}</span>` : ''}
        <button class="btn-edit-ps btn-edit-ps-item" data-id="${ps.id}" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-delete-ps" data-id="${ps.id}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    psList.appendChild(item);
  });

  // Edit handlers
  psList.querySelectorAll('.btn-edit-ps-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { data: ps } = await supabase.from('problem_statements').select('*').eq('id', btn.dataset.id).single();
      if (!ps) return;
      
      document.getElementById('edit-ps-id').value = ps.id;
      document.getElementById('edit-ps-title').value = ps.title;
      document.getElementById('edit-ps-diff').value = ps.difficulty;
      document.getElementById('edit-ps-desc').value = ps.description;
      
      document.getElementById('modal-edit-ps').classList.add('active');
    });
  });

  // Delete handlers
  psList.querySelectorAll('.btn-delete-ps').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this problem statement?')) return;
      const { error } = await supabase
        .from('problem_statements')
        .delete()
        .eq('id', btn.dataset.id);

      if (!error) {
        renderPSList();
        renderOverview();
      }
    });
  });
}

document.getElementById('btn-save-ps').addEventListener('click', async () => {
  const id = document.getElementById('edit-ps-id').value;
  const btn = document.getElementById('btn-save-ps');
  btn.textContent = 'Saving...';
  
  await supabase.from('problem_statements').update({
    title: document.getElementById('edit-ps-title').value,
    difficulty: document.getElementById('edit-ps-diff').value,
    description: document.getElementById('edit-ps-desc').value
  }).eq('id', id);
  
  btn.textContent = 'Save Changes';
  document.getElementById('modal-edit-ps').classList.remove('active');
  renderPSList();
});

// ═════════════════════════════════════════
//  MENTORS TAB
// ═════════════════════════════════════════

// Add Mentor
const addMentorBtn = document.getElementById('btn-add-mentor');
if (addMentorBtn) {
  addMentorBtn.addEventListener('click', async () => {
    const name = document.getElementById('mentor-name').value.trim();
    const email = document.getElementById('mentor-email').value.trim();
    const password = document.getElementById('mentor-password').value.trim();
    const dept = document.getElementById('mentor-dept').value;

    if (!name || !email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    const { error } = await supabase
      .from('mentors')
      .insert({ name, email, password, department: dept });

    if (error) {
      alert('Error adding mentor: ' + error.message);
      return;
    }

    // Clear form
    document.getElementById('mentor-name').value = '';
    document.getElementById('mentor-email').value = '';
    document.getElementById('mentor-password').value = '';

    renderMentors();
  });
}

async function renderMentors() {
  const { data: mentors } = await supabase
    .from('mentors')
    .select('*')
    .order('department, name');

  // Get assignment counts
  const { data: assignments } = await supabase
    .from('mentor_assignments')
    .select('mentor_id');

  const counts = {};
  (assignments || []).forEach((a) => {
    counts[a.mentor_id] = (counts[a.mentor_id] || 0) + 1;
  });

  const list = document.getElementById('mentor-list');
  list.innerHTML = '';

  const items = mentors || [];

  if (items.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-tertiary);">
        <p>No mentors registered yet.</p>
      </div>
    `;
    return;
  }

  items.forEach((m, i) => {
    const assignedCount = counts[m.id] || 0;
    const item = document.createElement('div');
    item.className = 'ps-item';

    item.innerHTML = `
      <div class="ps-item-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="ps-item-body">
        <div class="ps-item-title">${m.name}</div>
        <div class="ps-item-desc">${m.email}</div>
      </div>
      <div class="ps-item-meta">
        <span class="badge badge-medium">${DEPT_NAMES[m.department] || m.department}</span>
        <span class="ps-taken-tag">${assignedCount}/8 teams</span>
        <button class="btn-edit-ps btn-edit-mentor-item" data-id="${m.id}" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-delete-ps" data-id="${m.id}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    list.appendChild(item);
  });

  // Edit handlers
  list.querySelectorAll('.btn-edit-mentor-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { data: mentor } = await supabase.from('mentors').select('*').eq('id', btn.dataset.id).single();
      if (!mentor) return;
      
      document.getElementById('edit-mentor-id').value = mentor.id;
      document.getElementById('edit-mentor-name').value = mentor.name;
      document.getElementById('edit-mentor-email').value = mentor.email;
      document.getElementById('edit-mentor-password').value = mentor.password;
      document.getElementById('edit-mentor-dept').value = mentor.department;
      
      document.getElementById('modal-edit-mentor').classList.add('active');
    });
  });

  // Delete handlers
  list.querySelectorAll('.btn-delete-ps').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this mentor? This will also remove their team assignments.')) return;
      const { error } = await supabase
        .from('mentors')
        .delete()
        .eq('id', btn.dataset.id);

      if (!error) renderMentors();
    });
  });
}

document.getElementById('btn-save-mentor').addEventListener('click', async () => {
  const id = document.getElementById('edit-mentor-id').value;
  const btn = document.getElementById('btn-save-mentor');
  btn.textContent = 'Saving...';
  
  await supabase.from('mentors').update({
    name: document.getElementById('edit-mentor-name').value,
    email: document.getElementById('edit-mentor-email').value,
    password: document.getElementById('edit-mentor-password').value,
    department: document.getElementById('edit-mentor-dept').value
  }).eq('id', id);
  
  btn.textContent = 'Save Changes';
  document.getElementById('modal-edit-mentor').classList.remove('active');
  renderMentors();
});

// ─── INIT ───
renderOverview();
