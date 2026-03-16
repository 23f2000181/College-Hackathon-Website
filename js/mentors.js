/* ═══════════════════════════════════════════════
   HackVerse — Mentor Selection Logic (Student)
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';
import {
  requireAuth,
  initAppNav,
  showToast,
  getMentorsByDept,
  getTeamMentor,
  assignMentor,
  DEPT_NAMES,
  getSelectedPS,
} from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);
  checkPSAndLoad();
}

async function checkPSAndLoad() {
  try {
    // Check if team has selected a PS
    const ps = await getSelectedPS(session.teamId);

    // Show warning if no PS selected but still load mentors
    if (!ps) {
      const warningDiv = document.createElement('div');
      warningDiv.className = 'app-card';
      warningDiv.style.cssText = 'background: #fff3cd; color: #856404; margin-bottom: 20px; padding: 16px; border-radius: 8px;';
      warningDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.5rem;">⚠️</span>
          <div>
            <strong>Select a Problem Statement first</strong>
            <p style="margin: 4px 0 0; font-size: 0.9rem;">You need to select a problem statement before you can choose a mentor.</p>
          </div>
          <a href="/pages/problems.html" class="btn-review" style="margin-left: auto;">Browse Problems</a>
        </div>
      `;

      const header = document.querySelector('.page-header');
      header.parentNode.insertBefore(warningDiv, header.nextSibling);
    }

    // Always load mentors regardless of PS selection
    loadMentors();
  } catch (error) {
    console.error('Error in checkPSAndLoad:', error);
    loadMentors(); // Fallback to loading mentors
  }
}

let selectedMentorId = null;

async function loadMentors() {
  const grid = document.getElementById('mentors-grid');
  const empty = document.getElementById('mentors-empty');
  const currentSection = document.getElementById('current-mentor');

  if (!grid) return;

  // Check if team already has a mentor
  let existingMentor = null;
  try {
    existingMentor = await getTeamMentor(session.teamId);
  } catch (error) {
    console.error('Error fetching existing mentor:', error);
  }

  if (existingMentor) {
    currentSection.style.display = 'block';
    const initials = existingMentor.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    document.getElementById('mentor-avatar').textContent = initials;
    document.getElementById('mentor-name-text').textContent = existingMentor.name;
    document.getElementById('mentor-dept-text').textContent =
      DEPT_NAMES[existingMentor.department] || existingMentor.department;
  } else {
    currentSection.style.display = 'none';
  }

  // Get mentors for this department
  let mentors = [];
  try {
    mentors = await getMentorsByDept(session.department, session.academic_year);
    console.log('Mentors fetched:', mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
  }

  if (mentors.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    empty.innerHTML = `
      <span>🎓</span>
      <p>No mentors found in your department (${DEPT_NAMES[session.department] || session.department}).</p>
      <p style="font-size:0.85rem; margin-top:8px;">Please contact your coordinator if you believe this is an error.</p>
    `;
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = '';

  mentors.forEach((mentor) => {
    const isFull = mentor.slotsAvailable <= 0;
    const isSelected = existingMentor && existingMentor.id === mentor.id;
    const hasOtherMentor = existingMentor && !isSelected;
    const canSelect = !isFull && !hasOtherMentor && !existingMentor;

    const card = document.createElement('div');
    card.className = `team-card ${isFull ? 'full' : ''} ${isSelected ? 'selected' : ''}`;

    const initials = mentor.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Calculate slot status
    const slotsUsed = mentor.assignedCount || 0;
    const slotsTotal = 4;
    const slotsLeft = slotsTotal - slotsUsed;

    card.innerHTML = `
      <div class="team-card-content">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <div class="nav-avatar" style="width:48px; height:48px; font-size:1.1rem; background: var(--gradient-1);">${initials}</div>
          <div style="flex:1;">
            <h3 style="font-weight:600; color:var(--text-primary); margin-bottom:4px;">${mentor.name}</h3>
            <p style="color:var(--text-secondary); font-size:0.9rem;">${DEPT_NAMES[mentor.department] || mentor.department}</p>
          </div>
        </div>
        
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
            <span style="color:var(--text-secondary);">Available Slots</span>
            <span style="color:${slotsLeft > 0 ? '#10b981' : '#ef4444'}; font-weight:600;">
              ${slotsLeft}/${slotsTotal}
            </span>
          </div>
          <div style="height:4px; background:var(--bg-tertiary); border-radius:2px;">
            <div style="width:${(slotsUsed / slotsTotal) * 100}%; height:100%; background:var(--primary); border-radius:2px;"></div>
          </div>
        </div>
        
        <div style="display:flex; gap:8px; margin-top:8px;">
          ${isSelected ?
        `<span class="status-badge submitted" style="flex:1; text-align:center;">✓ Your Mentor</span>` :
        canSelect ?
          `<button class="btn-review btn-select-mentor" data-mentor-id="${mentor.id}" data-mentor-name="${mentor.name}" style="flex:1;">Select Mentor</button>` :
          isFull ?
            `<span class="status-badge pending" style="flex:1; text-align:center;">No Slots Available</span>` :
            hasOtherMentor ?
              `<span class="status-badge pending" style="flex:1; text-align:center;">Already Assigned</span>` :
              `<span class="status-badge pending" style="flex:1; text-align:center;">Not Available</span>`
      }
        </div>
        
        <div style="margin-top:12px; font-size:0.8rem; color:var(--text-tertiary);">
          📧 ${mentor.email || 'Email not available'}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Select button handlers
  grid.querySelectorAll('.btn-select-mentor').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedMentorId = btn.dataset.mentorId;
      document.getElementById('confirm-mentor-name').innerHTML =
        `You are selecting <strong>${btn.dataset.mentorName}</strong> as your mentor.`;
      document.getElementById('confirm-modal').style.display = 'flex';
    });
  });
}

// Modal handlers
document.getElementById('close-confirm-modal')?.addEventListener('click', () => {
  document.getElementById('confirm-modal').style.display = 'none';
});

document.getElementById('btn-cancel-select')?.addEventListener('click', () => {
  document.getElementById('confirm-modal').style.display = 'none';
});

document.getElementById('confirm-modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirm-modal')) {
    document.getElementById('confirm-modal').style.display = 'none';
  }
});

document.getElementById('btn-confirm-select')?.addEventListener('click', async () => {
  if (!selectedMentorId) return;

  const btn = document.getElementById('btn-confirm-select');
  btn.disabled = true;
  btn.textContent = 'Assigning...';

  const result = await assignMentor(session.teamId, selectedMentorId, session.academic_year);

  if (result.success) {
    showToast('Mentor assigned successfully!', 'success');
    document.getElementById('confirm-modal').style.display = 'none';
    loadMentors(); // Refresh
  } else {
    showToast(result.message || 'Failed to assign mentor', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Confirm Selection';
});