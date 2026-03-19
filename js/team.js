/* ═══════════════════════════════════════════════
   HackVerse — Team Details Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getTeamData, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';
import { supabase } from '/js/supabase.js';

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

  // ─── TEAM ROSTER WITH USNs ───
  const rosterEl = document.getElementById('roster-list');
  const colors = [
    'linear-gradient(135deg, #FF00E4, #33CCFF)',
    'linear-gradient(135deg, #33CCFF, #FFD700)',
    'linear-gradient(135deg, #FFD700, #00E49F)',
    'linear-gradient(135deg, #00E49F, #A855F7)',
  ];

  let membersData = []; // store fetched members with USNs
  let isEditMode = false;

  // Fetch members with USNs from Supabase
  async function loadRoster() {
    // Try fetching with member_usn column first
    let { data: members, error } = await supabase
      .from('team_members')
      .select('id, member_name, member_usn, member_index')
      .eq('team_id', session.teamId)
      .order('member_index');

    // If member_usn column doesn't exist yet, fall back without it
    if (error) {
      const { data: fallbackMembers } = await supabase
        .from('team_members')
        .select('id, member_name, member_index')
        .eq('team_id', session.teamId)
        .order('member_index');

      members = (fallbackMembers || []).map(m => ({ ...m, member_usn: '' }));
    }

    membersData = members || [];
    renderRoster(false);
  }

  function renderRoster(editMode) {
    rosterEl.innerHTML = '';
    isEditMode = editMode;

    membersData.forEach((m, i) => {
      const li = document.createElement('li');
      li.className = 'roster-item';

      const isLeader = (i === 0);
      // Leader USN comes from the team's usn field (already provided at registration)
      const usn = isLeader ? (session.usn || m.member_usn || '') : (m.member_usn || '');
      const usnDisplay = usn || '—';

      if (editMode && !isLeader) {
        // Only members 2-4 can edit their USNs
        li.innerHTML = `
          <div class="roster-avatar" style="background: ${colors[i]}; color: white;">${m.member_name.charAt(0).toUpperCase()}</div>
          <div class="roster-info">
            <span class="roster-name">${m.member_name}</span>
            <span class="roster-role">Member ${i + 1}</span>
          </div>
          <div class="roster-usn-edit">
            <input type="text" class="roster-usn-input" data-member-id="${m.id}" value="${usn}" placeholder="Enter USN" />
          </div>
        `;
      } else {
        li.innerHTML = `
          <div class="roster-avatar" style="background: ${colors[i]}; color: white;">${m.member_name.charAt(0).toUpperCase()}</div>
          <div class="roster-info">
            <span class="roster-name">${m.member_name}</span>
            <span class="roster-role">${isLeader ? '★ Team Leader' : `Member ${i + 1}`}</span>
          </div>
          <div class="roster-usn-display">
            <span class="roster-usn-label">USN:</span>
            <span class="roster-usn-value ${!usn ? 'missing' : ''}">${usnDisplay}</span>
          </div>
        `;
      }

      rosterEl.appendChild(li);
    });

    // Show/hide edit actions
    const editActions = document.getElementById('roster-edit-actions');
    const editBtn = document.getElementById('btn-edit-roster');
    if (editActions) editActions.style.display = editMode ? 'flex' : 'none';
    if (editBtn) editBtn.style.display = editMode ? 'none' : '';
  }

  // Edit button
  const editBtn = document.getElementById('btn-edit-roster');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      renderRoster(true);
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById('btn-cancel-roster');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      renderRoster(false);
    });
  }

  // Save button
  const saveBtn = document.getElementById('btn-save-roster');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const inputs = rosterEl.querySelectorAll('.roster-usn-input');
      let hasError = false;

      for (const input of inputs) {
        const memberId = input.dataset.memberId;
        const newUsn = input.value.trim();

        const { error } = await supabase
          .from('team_members')
          .update({ member_usn: newUsn })
          .eq('id', memberId);

        if (error) {
          hasError = true;
          console.error('Error updating USN:', error);
        }
      }

      if (hasError) {
        showTeamToast('Error updating some USNs. Please try again.', 'error');
      } else {
        showTeamToast('USNs updated successfully!', 'success');
        // Reload roster to reflect changes
        await loadRoster();
      }
    });
  }

  // Toast helper
  function showTeamToast(message, type = 'success') {
    let toast = document.querySelector('.team-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'team-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = `${type === 'success' ? '✓' : '✕'} ${message}`;
    toast.className = `team-toast ${type}`;
    void toast.offsetWidth;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3500);
  }

  // Load roster on page load
  loadRoster();

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
