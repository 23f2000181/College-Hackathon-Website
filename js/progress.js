/* ═══════════════════════════════════════════════
   HackVerse — Progress Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getTeamData, getSelectedPS, initAppNav } from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  const team = getTeamData(session);
  const selectedPS = getSelectedPS(session.teamId);

  let completedSteps = 1; // registration is always complete

  // Step 1 date
  if (team && team.registeredAt) {
    const d = new Date(team.registeredAt);
    document.getElementById('step-1-date').textContent = `Completed on ${d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })}`;
  }

  // Step 2: Problem Statement
  if (selectedPS) {
    completedSteps = 2;
    const step2 = document.getElementById('step-2');
    step2.classList.remove('locked');
    step2.classList.add('completed');

    document.getElementById('step-2-badge').textContent = 'Completed';
    document.getElementById('step-2-badge').className = 'badge badge-selected';
    document.getElementById('step-2-desc').textContent = 'You have selected a problem statement.';

    // Remove action CTA, show PS info
    const actionEl = document.getElementById('step-2-action');
    actionEl.innerHTML = `
      <div class="step-ps-info">
        <div class="step-ps-label">Selected Problem</div>
        <div class="step-ps-title">${selectedPS.title}</div>
      </div>
    `;

    // Step 3 becomes active
    const step3 = document.getElementById('step-3');
    step3.classList.remove('locked');
    step3.classList.add('active');
    step3.querySelector('.badge').textContent = 'In Progress';
    step3.querySelector('.badge').className = 'badge badge-active';
  } else {
    // Step 2 is active (pending)
    const step2 = document.getElementById('step-2');
    step2.classList.add('active');
    document.getElementById('step-2-badge').textContent = 'Action Needed';
    document.getElementById('step-2-badge').className = 'badge badge-active';
  }

  // Progress bar
  const percentage = (completedSteps / 5) * 100;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
  document.getElementById('progress-label').textContent = `${completedSteps} of 5 milestones completed`;
}
