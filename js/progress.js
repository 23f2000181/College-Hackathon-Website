/* ═══════════════════════════════════════════════
   HackVerse — Progress Tracking Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getSelectedPS, getTeamMentor, getSubmission, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  async function loadProgress() {
    const selectedPS = await getSelectedPS(session.teamId);
    const mentor = await getTeamMentor(session.teamId);
    const submission = await getSubmission(session.teamId);

    let completed = 1; // Step 1: registration always done
    const totalSteps = 6;

    // --- Step 1: Registration (always completed) ---
    // Already set in HTML

    // --- Step 2: Problem statement ---
    if (selectedPS) {
      completed = 2;
      const step2 = document.getElementById('step-2');
      if (step2) {
        step2.classList.remove('locked');
        step2.classList.add('completed');
      }
      const badge2 = document.getElementById('step-2-badge');
      if (badge2) { badge2.textContent = 'Completed'; badge2.className = 'badge badge-selected'; }
      const desc2 = document.getElementById('step-2-desc');
      if (desc2) desc2.textContent = `Selected: ${selectedPS.title}`;
      const action2 = document.getElementById('step-2-action');
      if (action2) action2.style.display = 'none';

      // Unlock step 3
      const step3 = document.getElementById('step-3');
      if (step3) step3.classList.remove('locked');
      const badge3 = document.getElementById('step-3-badge');
      if (badge3) { badge3.textContent = 'Pending'; badge3.className = 'badge badge-pending'; }
      const action3 = document.getElementById('step-3-action');
      if (action3) action3.style.display = 'block';
    }

    // --- Step 3: Mentor selected ---
    if (mentor) {
      completed = 3;
      const step3 = document.getElementById('step-3');
      if (step3) {
        step3.classList.remove('locked');
        step3.classList.add('completed');
      }
      const badge3 = document.getElementById('step-3-badge');
      if (badge3) { badge3.textContent = 'Completed'; badge3.className = 'badge badge-selected'; }
      const desc3 = document.getElementById('step-3-desc');
      if (desc3) desc3.textContent = `Mentor: ${mentor.name}`;
      const action3 = document.getElementById('step-3-action');
      if (action3) action3.style.display = 'none';

      // Unlock step 4
      const step4 = document.getElementById('step-4');
      if (step4) step4.classList.remove('locked');
      const badge4 = document.getElementById('step-4-badge');
      if (badge4) { badge4.textContent = 'Pending'; badge4.className = 'badge badge-pending'; }
      const action4 = document.getElementById('step-4-action');
      if (action4) action4.style.display = 'block';
    }

    // --- Step 4: Submission ---
    if (submission) {
      completed = 4;
      const step4 = document.getElementById('step-4');
      if (step4) {
        step4.classList.remove('locked');
        step4.classList.add('completed');
      }
      const badge4 = document.getElementById('step-4-badge');
      if (badge4) { badge4.textContent = 'Completed'; badge4.className = 'badge badge-selected'; }
      const desc4 = document.getElementById('step-4-desc');
      if (desc4) desc4.textContent = 'Your project has been submitted successfully.';
      const action4 = document.getElementById('step-4-action');
      if (action4) action4.style.display = 'none';
    }

    // Progress bar
    const pct = Math.round((completed / totalSteps) * 100);
    const progressBar = document.getElementById('progress-bar');
    const progressLabel = document.getElementById('progress-label');

    if (progressBar) {
      setTimeout(() => {
        progressBar.style.width = pct + '%';
      }, 300);
    }
    if (progressLabel) {
      progressLabel.textContent = `${completed} of ${totalSteps} milestones completed`;
    }
  }

  loadProgress();
}
