/* ═══════════════════════════════════════════════
   HackVerse — Progress Tracking Page Logic
   ═══════════════════════════════════════════════ */

import { requireAuth, getSelectedPS, initAppNav, DEPT_NAMES } from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);

  async function loadProgress() {
    const selectedPS = await getSelectedPS(session.teamId);

    // Step 1: Registration — always complete
    const step1 = document.getElementById('step-register');
    if (step1) step1.classList.add('completed');

    // Step 2: Problem statement selected
    const step2 = document.getElementById('step-ps');
    const step2Badge = step2?.querySelector('.step-badge');
    if (selectedPS) {
      step2?.classList.add('completed');
      if (step2Badge) { step2Badge.textContent = '✓'; step2Badge.className = 'step-badge completed'; }

      // Show PS title
      const psInfo = document.getElementById('selected-ps-info');
      if (psInfo) psInfo.textContent = selectedPS.title;

      // Step 3 becomes active
      const step3 = document.getElementById('step-submit');
      step3?.classList.add('active');
      const step3Badge = step3?.querySelector('.step-badge');
      if (step3Badge) { step3Badge.textContent = '→'; step3Badge.className = 'step-badge active'; }
    }

    // Calculate progress percentage
    let completed = 1; // registration always done
    if (selectedPS) completed = 2;
    const totalSteps = 5;
    const pct = Math.round((completed / totalSteps) * 100);

    const progressFill = document.getElementById('progress-fill');
    const progressPct = document.getElementById('progress-pct');

    if (progressFill) {
      setTimeout(() => {
        progressFill.style.width = pct + '%';
      }, 300);
    }
    if (progressPct) progressPct.textContent = pct + '%';
  }

  loadProgress();
}
