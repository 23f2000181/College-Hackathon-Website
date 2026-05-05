/* ═══════════════════════════════════════════════
   HackVerse — Team Details Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getTeamData, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';
import { supabase } from '/js/supabase.js';
import { jsPDF } from 'jspdf';

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

  // ─── CERTIFICATE GENERATOR ───
  async function downloadCertificate(memberName, btnEl) {
    if (!memberName || memberName === 'null' || memberName === 'No Name Provided') {
      showTeamToast('Member name is missing — please edit the roster first.', 'error');
      return;
    }

    // Show loading state on button
    const origHTML = btnEl.innerHTML;
    btnEl.disabled = true;
    btnEl.innerHTML = `<span class="cert-btn-spinner"></span> Generating…`;

    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.src = '/hackversecertificate.png';
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          // Draw certificate onto canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // ── Name overlay ──
          // Shrink font until the name fits within 55% of the canvas width
          const maxWidth = canvas.width * 0.55;
          let fontSize = 52;
          ctx.font = `bold italic ${fontSize}px "Times New Roman", Times, serif`;
          while (ctx.measureText(memberName).width > maxWidth && fontSize > 24) {
            fontSize -= 1;
            ctx.font = `bold italic ${fontSize}px "Times New Roman", Times, serif`;
          }

          ctx.fillStyle = '#1a1a2e';   // deep navy — adjust if cert background differs
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Y: ~57% down, X: ~58% right — centres over the blank line after "Mr./Ms."
          const nameY = Math.round(canvas.height * 0.57);
          const nameX = Math.round(canvas.width * 0.58);
          ctx.fillText(memberName, nameX, nameY);

          // Export to PDF (landscape, pixel units matching canvas)
          // We divide width/height by 2 to account for DPI mismatch in Chrome (96 vs 72 DPI)
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2],
            hotfixes: ['px_scaling'],
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);

          // Use Blob URL download — works correctly in Chrome, Edge, Firefox
          const blob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = `${memberName.replace(/\s+/g, '_')}_HackVerse_Certificate.pdf`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          // Revoke after a short delay to let the browser start the download
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          resolve();
        };

        img.onerror = () => reject(new Error('Could not load certificate image.'));
      });

      showTeamToast(`Certificate downloaded for ${memberName}!`, 'success');
    } catch (err) {
      console.error('Certificate generation failed:', err);
      showTeamToast('Failed to generate certificate. Please try again.', 'error');
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = origHTML;
    }
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
        // Only members 2-4 can edit their names and USNs
        li.innerHTML = `
          <div class="roster-avatar" style="background: ${colors[i]}; color: white;">${m.member_name.charAt(0).toUpperCase()}</div>
          <div class="roster-info">
            <input type="text" class="roster-name-input" data-member-id="${m.id}" value="${m.member_name === 'null' ? '' : m.member_name}" placeholder="Enter Name" />
            <span class="roster-role">Member ${i + 1}</span>
          </div>
          <div class="roster-usn-edit">
            <input type="text" class="roster-usn-input" data-member-id="${m.id}" value="${usn}" placeholder="Enter USN" />
          </div>
        `;
      } else {
        // View mode — show name, USN, and individual download button
        const memberDisplayName = m.member_name === 'null' ? 'No Name Provided' : m.member_name;
        const hasName = m.member_name && m.member_name !== 'null';

        li.innerHTML = `
          <div class="roster-avatar" style="background: ${colors[i]}; color: white;">${hasName ? m.member_name.charAt(0).toUpperCase() : '?'}</div>
          <div class="roster-info">
            <span class="roster-name" style="${!hasName ? 'color: var(--text-tertiary); font-style: italic;' : ''}">${memberDisplayName}</span>
            <span class="roster-role">${isLeader ? '★ Team Leader' : `Member ${i + 1}`}</span>
          </div>
          <div class="roster-usn-display">
            <span class="roster-usn-label">USN:</span>
            <span class="roster-usn-value ${!usn ? 'missing' : ''}">${usnDisplay}</span>
          </div>
        `;

        // Add individual certificate download button after the item
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn-download-cert';
        dlBtn.title = `Download certificate for ${memberDisplayName}`;
        dlBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Certificate
        `;
        dlBtn.addEventListener('click', () => downloadCertificate(hasName ? m.member_name : null, dlBtn));
        li.appendChild(dlBtn);
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
      const usnInputs = rosterEl.querySelectorAll('.roster-usn-input');
      const nameInputs = rosterEl.querySelectorAll('.roster-name-input');
      let hasError = false;

      for (let i = 0; i < usnInputs.length; i++) {
        const memberId = usnInputs[i].dataset.memberId;
        const newUsn = usnInputs[i].value.trim();
        const newName = nameInputs[i] ? nameInputs[i].value.trim() : null;

        const updateData = { member_usn: newUsn };
        if (newName) {
          updateData.member_name = newName;
        } else if (newName === '') {
          updateData.member_name = 'null';
        }

        const { error } = await supabase
          .from('team_members')
          .update(updateData)
          .eq('id', memberId);

        if (error) {
          hasError = true;
          console.error('Error updating details:', error);
        }
      }

      if (hasError) {
        showTeamToast('Error updating details. Please try again.', 'error');
      } else {
        showTeamToast('Details updated successfully!', 'success');
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
