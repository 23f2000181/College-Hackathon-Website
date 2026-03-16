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
} from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);
  checkPSAndLoad();
}

async function checkPSAndLoad() {
  const ps = await getSelectedPS(session.teamId);
  if (!ps) {
    const grid = document.getElementById('mentors-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="display:block; grid-column: 1/-1; padding: 60px;">
          <span style="font-size: 3rem; margin-bottom: 20px; display: block;">🔒</span>
          <h3>Mentor Selection Locked</h3>
          <p>Please select a <strong>Problem Statement</strong> first to unlock mentor selection for your department.</p>
          <a href="/pages/problems.html" class="btn btn-primary" style="margin-top: 20px;">Browse Problems</a>
        </div>
      `;
    }
    const empty = document.getElementById('mentors-empty');
    if (empty) empty.style.display = 'none';
    return;
  }
  loadMentors();
}

let selectedMentorId = null;

async function loadMentors() {
  const grid = document.getElementById('mentors-grid');
  const empty = document.getElementById('mentors-empty');
  const currentSection = document.getElementById('current-mentor');

  // Check if team already has a mentor
  const existingMentor = await getTeamMentor(session.teamId);

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
  }

  // Get mentors for this department
  const mentors = await getMentorsByDept(session.department);

  if (mentors.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = '';

  mentors.forEach((mentor) => {
    const isFull = mentor.slotsAvailable <= 0;
    const isSelected = existingMentor && existingMentor.id === mentor.id;
    const hasOtherMentor = existingMentor && !isSelected;

    const card = document.createElement('div');
    card.className = `team-card ${isFull ? 'full' : ''} ${isSelected ? 'selected' : ''}`;

    const initials = mentor.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    card.innerHTML = `
      <div class="team-card-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="nav-avatar" style="width:42px; height:42px; font-size:0.9rem; flex-shrink:0;">${initials}</div>
          <span class="team-card-name">${mentor.name}</span>
        </div>
        <span class="team-card-dept">${DEPT_NAMES[mentor.department] || mentor.department}</span>
      </div>
      <div class="team-card-members">
        <strong>Email:</strong> ${mentor.email}
      </div>
      <div class="team-card-status" style="margin-top: 16px;">
        <div>
          <span class="status-badge ${isFull ? 'pending' : 'submitted'}">
            ${mentor.assignedCount}/${mentor.max_teams || 4} teams
          </span>
          ${isFull ? '<span style="color:var(--text-tertiary); font-size:0.82rem; margin-left:8px;">Full</span>' : ''}
        </div>
        ${
          isSelected
            ? '<span class="status-badge submitted">✓ Your Mentor</span>'
            : isFull || hasOtherMentor
            ? ''
            : `<button class="btn-review btn-select-mentor" data-mentor-id="${mentor.id}" data-mentor-name="${mentor.name}">Select</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });

  // Select button handlers
  grid.querySelectorAll('.btn-select-mentor').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedMentorId = btn.dataset.mentorId;
      document.getElementById('confirm-mentor-name').textContent =
        `You are selecting ${btn.dataset.mentorName} as your mentor.`;
      document.getElementById('confirm-modal').classList.add('active');
    });
  });
}

// Modal handlers
document.getElementById('close-confirm-modal').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.remove('active');
});

document.getElementById('btn-cancel-select').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.remove('active');
});

document.getElementById('confirm-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirm-modal')) {
    document.getElementById('confirm-modal').classList.remove('active');
  }
});

document.getElementById('btn-confirm-select').addEventListener('click', async () => {
  if (!selectedMentorId) return;

  const btn = document.getElementById('btn-confirm-select');
  btn.disabled = true;
  btn.textContent = 'Assigning...';

  const result = await assignMentor(session.teamId, selectedMentorId);

  if (result.success) {
    showToast('Mentor assigned successfully!', 'success');
    document.getElementById('confirm-modal').classList.remove('active');
    loadMentors(); // Refresh
  } else {
    showToast(result.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Confirm Selection';
});
