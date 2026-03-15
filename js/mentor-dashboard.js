/* ═══════════════════════════════════════════════
   HackVerse — Mentor Dashboard Logic
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';
import { requireMentorAuth, initAppNav, showToast, DEPT_NAMES } from '/js/shared.js';

const session = requireMentorAuth();
if (session) {
  initAppNav(session);
  initTabs();
  loadMyTeams();
}

// ─── TABS ───
function initTabs() {
  const tabs = document.querySelectorAll('.mentor-tab');
  const panels = document.querySelectorAll('.mentor-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.add('hidden'));
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.tab);
      panel.classList.remove('hidden');

      if (tab.dataset.tab === 'my-teams') loadMyTeams();
      if (tab.dataset.tab === 'submissions') loadSubmissions();
      if (tab.dataset.tab === 'weekly-reports') loadWeeklyReports();
      if (tab.dataset.tab === 'all-teams') loadAllTeams();
    });
  });
}

// ─── MY TEAMS ───
async function loadMyTeams() {
  const { data: assignments } = await supabase
    .from('mentor_assignments')
    .select('team_id')
    .eq('mentor_id', session.mentorId);

  const teamIds = (assignments || []).map((a) => a.team_id);
  const grid = document.getElementById('my-teams-grid');
  const empty = document.getElementById('my-teams-empty');

  if (teamIds.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // Fetch teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds);

  // Fetch members
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('team_id, member_name, member_index')
    .in('team_id', teamIds)
    .order('member_index');

  const membersByTeam = {};
  (allMembers || []).forEach((m) => {
    if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
    membersByTeam[m.team_id].push(m.member_name);
  });

  // Fetch PS
  const { data: allPS } = await supabase
    .from('problem_statements')
    .select('id, title, selected_by')
    .in('selected_by', teamIds);

  const psByTeam = {};
  (allPS || []).forEach((ps) => {
    if (ps.selected_by) psByTeam[ps.selected_by] = ps;
  });

  // Fetch submissions
  const { data: subs } = await supabase
    .from('submissions')
    .select('team_id')
    .in('team_id', teamIds);

  const submittedTeams = new Set((subs || []).map((s) => s.team_id));

  grid.innerHTML = '';

  (teams || []).forEach((team) => {
    const members = membersByTeam[team.id] || [];
    const ps = psByTeam[team.id];
    const hasSubmitted = submittedTeams.has(team.id);

    const card = document.createElement('div');
    card.className = 'team-card';
    card.innerHTML = `
      <div class="team-card-header">
        <span class="team-card-name">${team.leader_name}'s Team</span>
        <span class="team-card-dept">${DEPT_NAMES[team.department] || team.department}</span>
      </div>
      <div class="team-card-members">
        <strong>Members:</strong><br/>
        ${[team.leader_name, ...members].join(', ') || '—'}
      </div>
      ${ps ? `
        <div class="team-card-ps">
          <div class="team-card-ps-label">Problem Statement</div>
          <div class="team-card-ps-title">${ps.title}</div>
        </div>
      ` : `
        <div class="team-card-ps">
          <div class="team-card-ps-label">Problem Statement</div>
          <div class="team-card-ps-title" style="color: var(--text-tertiary);">Not selected yet</div>
        </div>
      `}
      <div class="team-card-status">
        <span class="status-badge ${hasSubmitted ? 'submitted' : 'pending'}">
          ${hasSubmitted ? '✓ Submitted' : '⏳ Pending'}
        </span>
        <button class="btn-review" data-team-id="${team.id}" data-team-name="${team.leader_name}'s Team">
          Write Review
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Review button handlers
  grid.querySelectorAll('.btn-review').forEach((btn) => {
    btn.addEventListener('click', () => openReviewModal(btn.dataset.teamId, btn.dataset.teamName));
  });
}

// ─── SUBMISSIONS ───
async function loadSubmissions() {
  // Get my assigned team IDs
  const { data: assignments } = await supabase
    .from('mentor_assignments')
    .select('team_id')
    .eq('mentor_id', session.mentorId);

  const teamIds = (assignments || []).map((a) => a.team_id);
  const list = document.getElementById('submissions-list');
  const empty = document.getElementById('submissions-empty');

  if (teamIds.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  // Fetch submissions
  const { data: subs } = await supabase
    .from('submissions')
    .select('*')
    .in('team_id', teamIds)
    .order('submitted_at', { ascending: false });

  if (!subs || subs.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // Fetch team names
  const subTeamIds = subs.map((s) => s.team_id);
  const { data: teams } = await supabase
    .from('teams')
    .select('id, leader_name, department')
    .in('id', subTeamIds);

  const teamsMap = {};
  (teams || []).forEach((t) => (teamsMap[t.id] = t));

  // Fetch my reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('mentor_id', session.mentorId)
    .in('team_id', subTeamIds);

  const reviewsMap = {};
  (reviews || []).forEach((r) => (reviewsMap[r.team_id] = r));

  list.innerHTML = '';
  renderSubmissionCards(subs, teamsMap, reviewsMap, list);
}

// ─── ALL TEAMS ───
let currentDeptFilter = 'all';

async function loadAllTeams() {
  let query = supabase.from('teams').select('id, leader_name, department');
  
  if (currentDeptFilter !== 'all') {
    query = query.eq('department', currentDeptFilter);
  }

  const { data: teams } = await query;

  const list = document.getElementById('all-teams-list');
  const empty = document.getElementById('all-teams-empty');

  if (!teams || teams.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  const teamIds = teams.map((t) => t.id);
  const teamsMap = {};
  teams.forEach((t) => (teamsMap[t.id] = t));

  const { data: subs } = await supabase
    .from('submissions')
    .select('*')
    .in('team_id', teamIds)
    .order('submitted_at', { ascending: false });

  if (!subs || subs.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // Fetch my reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('mentor_id', session.mentorId)
    .in('team_id', teamIds);

  const reviewsMap = {};
  (reviews || []).forEach((r) => (reviewsMap[r.team_id] = r));

  list.innerHTML = '';
  renderSubmissionCards(subs, teamsMap, reviewsMap, list);
}

// Attach filter listener
document.addEventListener('DOMContentLoaded', () => {
  const filterSelect = document.getElementById('all-teams-dept-filter');
  if (filterSelect) {
    // Optionally set default to the mentor's department initially
    filterSelect.value = 'all';
    
    filterSelect.addEventListener('change', (e) => {
      currentDeptFilter = e.target.value;
      loadAllTeams();
    });
  }
});

// ─── WEEKLY REPORTS ───
async function loadWeeklyReports() {
  const { data: assignments } = await supabase
    .from('mentor_assignments')
    .select('team_id')
    .eq('mentor_id', session.mentorId);

  const teamIds = (assignments || []).map((a) => a.team_id);
  const list = document.getElementById('weekly-reports-list');
  const empty = document.getElementById('weekly-reports-empty');

  if (teamIds.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  const { data: reports } = await supabase
    .from('weekly_reports')
    .select('*')
    .in('team_id', teamIds)
    .order('submitted_at', { ascending: false });

  if (!reports || reports.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  const { data: teams } = await supabase
    .from('teams')
    .select('id, leader_name, department')
    .in('id', teamIds);

  const teamsMap = {};
  (teams || []).forEach((t) => (teamsMap[t.id] = t));

  list.innerHTML = '';
  reports.forEach(r => {
    const team = teamsMap[r.team_id] || {};
    const card = document.createElement('div');
    card.className = 'submission-card';
    card.style.marginBottom = '16px';
    
    let statusColor = '#ff6a00';
    let statusBg = 'rgba(255,106,0,0.1)';
    if (r.mentor_status === 'Approved') { statusColor = 'var(--accent-green)'; statusBg = 'rgba(0,228,159,0.1)'; }
    if (r.mentor_status === 'Needs Revision') { statusColor = 'var(--accent-pink)'; statusBg = 'rgba(255,0,228,0.1)'; }
    
    card.innerHTML = `
      <div class="submission-header" style="margin-bottom: 12px;">
        <div>
          <span class="submission-team">${team.leader_name || 'Unknown'}'s Team (Week ${r.week_number})</span>
          <span class="team-card-dept" style="margin-left: 12px;">${DEPT_NAMES[team.department] || ''}</span>
        </div>
        <button class="btn-review btn-report-review" data-report-id="${r.id}" data-team-name="${team.leader_name || 'Unknown'}'s Team (Week ${r.week_number})" data-status="${r.mentor_status}" data-comment="${r.mentor_comment || ''}">
          Review Report
        </button>
      </div>
      <div class="submission-readme" style="margin-bottom: 12px; font-size: 0.95rem; color: var(--text-primary); border: 1px solid var(--border-subtle); background: var(--bg-primary); padding: 12px; border-radius: 8px;">
        ${r.report_text}
      </div>
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; background: ${statusBg}; color: ${statusColor}; text-transform: uppercase;">Status: ${r.mentor_status}</span>
        ${r.mentor_comment ? `<span style="font-size: 0.85rem; color: var(--text-secondary);"><strong style="color:var(--accent-yellow);">Feedback:</strong> ${r.mentor_comment}</span>` : ''}
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.btn-report-review').forEach((btn) => {
    btn.addEventListener('click', () => {
      openReportReviewModal(btn.dataset.reportId, btn.dataset.teamName, btn.dataset.status, btn.dataset.comment);
    });
  });
}

function renderSubmissionCards(subs, teamsMap, reviewsMap, container) {
  subs.forEach((sub) => {
    const team = teamsMap[sub.team_id] || {};
    const review = reviewsMap[sub.team_id];

    const card = document.createElement('div');
    card.className = 'submission-card';
    card.innerHTML = `
      <div class="submission-header">
        <div>
          <span class="submission-team">${team.leader_name || 'Unknown'}'s Team</span>
          <span class="team-card-dept" style="margin-left: 12px;">${DEPT_NAMES[team.department] || ''}</span>
        </div>
        <button class="btn-review" data-team-id="${sub.team_id}" data-team-name="${team.leader_name || 'Unknown'}'s Team">
          ${review ? 'Update Review' : 'Write Review'}
        </button>
      </div>
      <div class="submission-links">
        <a href="${sub.github_url}" target="_blank" class="submission-link github">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub Repo
        </a>
        <a href="${sub.youtube_url}" target="_blank" class="submission-link youtube">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
          YouTube Demo
        </a>
      </div>
      <div class="submission-readme">${sub.readme_desc}</div>
      ${review ? `
        <div class="submission-review-existing">
          <div class="review-label">Your Review</div>
          <div class="review-rating-display">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
          <div class="review-text">${review.feedback}</div>
        </div>
      ` : ''}
    `;

    container.appendChild(card);
  });

  // Review button handlers
  container.querySelectorAll('.btn-review').forEach((btn) => {
    btn.addEventListener('click', () => openReviewModal(btn.dataset.teamId, btn.dataset.teamName));
  });
}

// ─── REVIEW MODAL ───
let currentReviewTeamId = null;
let currentRating = 0;

function openReviewModal(teamId, teamName) {
  currentReviewTeamId = teamId;
  currentRating = 0;
  document.getElementById('review-team-name').textContent = teamName;
  document.getElementById('review-feedback').value = '';
  document.querySelectorAll('.star').forEach((s) => s.classList.remove('active'));
  document.getElementById('review-modal').classList.add('active');

  // Load existing review if any
  loadExistingReview(teamId);
}

async function loadExistingReview(teamId) {
  const { data: review } = await supabase
    .from('reviews')
    .select('*')
    .eq('mentor_id', session.mentorId)
    .eq('team_id', teamId)
    .maybeSingle();

  if (review) {
    currentRating = review.rating;
    document.getElementById('review-feedback').value = review.feedback;
    document.querySelectorAll('.star').forEach((s) => {
      if (parseInt(s.dataset.rating) <= review.rating) {
        s.classList.add('active');
      }
    });
  }
}

// Star rating
document.getElementById('rating-stars').addEventListener('click', (e) => {
  const star = e.target.closest('.star');
  if (!star) return;
  currentRating = parseInt(star.dataset.rating);
  document.querySelectorAll('.star').forEach((s) => {
    s.classList.toggle('active', parseInt(s.dataset.rating) <= currentRating);
  });
});

// Close modal
document.getElementById('close-review-modal').addEventListener('click', () => {
  document.getElementById('review-modal').classList.remove('active');
});

document.getElementById('review-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('review-modal')) {
    document.getElementById('review-modal').classList.remove('active');
  }
});

// Submit review
document.getElementById('btn-submit-review').addEventListener('click', async () => {
  if (!currentReviewTeamId || !currentRating) {
    showToast('Please select a rating.', 'error');
    return;
  }

  const feedback = document.getElementById('review-feedback').value.trim();
  if (!feedback) {
    showToast('Please write some feedback.', 'error');
    return;
  }

  // Upsert review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('mentor_id', session.mentorId)
    .eq('team_id', currentReviewTeamId)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from('reviews')
      .update({ feedback, rating: currentRating, reviewed_at: new Date().toISOString() })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabase
      .from('reviews')
      .insert({
        mentor_id: session.mentorId,
        team_id: currentReviewTeamId,
        feedback,
        rating: currentRating,
      }));
  }

  if (error) {
    showToast('Error saving review: ' + error.message, 'error');
    return;
  }

  showToast('Review saved successfully!', 'success');
  document.getElementById('review-modal').classList.remove('active');

  // Refresh current tab
  const activeTab = document.querySelector('.mentor-tab.active');
  if (activeTab) {
    if (activeTab.dataset.tab === 'submissions') loadSubmissions();
    if (activeTab.dataset.tab === 'all-teams') loadAllTeams();
  }
});

// ─── REPORT REVIEW MODAL ───
let currentReportId = null;

function openReportReviewModal(reportId, teamName, status, comment) {
  currentReportId = reportId;
  document.getElementById('report-team-name').textContent = teamName;
  document.getElementById('report-mentor-status').value = status || 'Pending';
  document.getElementById('report-mentor-comment').value = comment || '';
  document.getElementById('review-report-modal').classList.add('active');
}

document.getElementById('close-review-report-modal').addEventListener('click', () => {
  document.getElementById('review-report-modal').classList.remove('active');
});

document.getElementById('review-report-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('review-report-modal')) {
    document.getElementById('review-report-modal').classList.remove('active');
  }
});

document.getElementById('btn-submit-report-review').addEventListener('click', async () => {
  if (!currentReportId) return;

  const status = document.getElementById('report-mentor-status').value;
  const comment = document.getElementById('report-mentor-comment').value.trim();

  const btn = document.getElementById('btn-submit-report-review');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  const { error } = await supabase
    .from('weekly_reports')
    .update({ mentor_status: status, mentor_comment: comment })
    .eq('id', currentReportId);

  btn.textContent = 'Submit Feedback';
  btn.disabled = false;

  if (error) {
    showToast('Error saving feedback: ' + error.message, 'error');
    return;
  }

  showToast('Report feedback saved successfully!', 'success');
  document.getElementById('review-report-modal').classList.remove('active');
  loadWeeklyReports();
});
