/* ═══════════════════════════════════════════════
   HackVerse — Project Submission Logic
   ═══════════════════════════════════════════════ */

import {
  requireAuth,
  initAppNav,
  showToast,
  getSelectedPS,
  getTeamMentor,
  getSubmission,
  upsertSubmission,
} from '/js/shared.js';

const session = requireAuth();
if (session) {
  initAppNav(session);
  initSubmission();
}

async function initSubmission() {
  const prereqWarning = document.getElementById('prereq-warning');
  const prereqText = document.getElementById('prereq-text');
  const formCard = document.getElementById('submit-form-card');

  // Check prerequisites
  const ps = await getSelectedPS(session.teamId);
  const mentor = await getTeamMentor(session.teamId);

  const missing = [];
  if (!ps) missing.push('select a problem statement');
  if (!mentor) missing.push('select a mentor');

  if (missing.length > 0) {
    prereqWarning.style.display = 'block';
    prereqText.textContent = `Please ${missing.join(' and ')} before submitting your project.`;
    // Still show form but disable submit
    document.getElementById('btn-submit-project').disabled = true;
    document.getElementById('btn-submit-project').style.opacity = '0.5';
    document.getElementById('btn-submit-project').style.cursor = 'not-allowed';
  }

  // Load existing submission
  const existing = await getSubmission(session.teamId);
  if (existing) {
    document.getElementById('github-url').value = existing.github_url;
    document.getElementById('youtube-url').value = existing.youtube_url;
    document.getElementById('readme-desc').value = existing.readme_desc;

    document.getElementById('submission-status').style.display = 'block';
    const date = new Date(existing.updated_at || existing.submitted_at);
    document.getElementById('last-submitted-text').textContent =
      `Last updated: ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    document.getElementById('btn-submit-project').textContent = 'Update Submission →';
  }
}

// Submit handler
document.getElementById('btn-submit-project').addEventListener('click', async () => {
  const githubUrl = document.getElementById('github-url').value.trim();
  const youtubeUrl = document.getElementById('youtube-url').value.trim();
  const readmeDesc = document.getElementById('readme-desc').value.trim();

  // Validate
  if (!githubUrl || !youtubeUrl || !readmeDesc) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  // Simple URL validation
  try {
    new URL(githubUrl);
    new URL(youtubeUrl);
  } catch {
    showToast('Please enter valid URLs.', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-project');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  const success = await upsertSubmission(session.teamId, {
    github_url: githubUrl,
    readme_desc: readmeDesc,
    youtube_url: youtubeUrl,
  });

  if (success) {
    showToast('Project submitted successfully! 🎉', 'success');
    btn.textContent = 'Update Submission →';

    // Update status
    document.getElementById('submission-status').style.display = 'block';
    const now = new Date();
    document.getElementById('last-submitted-text').textContent =
      `Last updated: ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    showToast('Error submitting project. Please try again.', 'error');
    btn.textContent = 'Submit Project →';
  }

  btn.disabled = false;
});
