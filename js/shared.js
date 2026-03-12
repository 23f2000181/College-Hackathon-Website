/* ═══════════════════════════════════════════════
   HackVerse — Auth Guard & Shared Utilities
   Used by all logged-in pages (dashboard, team, problems, progress)
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';

// ─── SESSION CHECK ───
export function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = '/login.html';
    return null;
  }
  return session;
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('hackverse_session'));
  } catch {
    return null;
  }
}

// ─── SUPABASE DATA HELPERS (async) ───

export async function getTeamData(teamId) {
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();

  if (!team) return null;

  const { data: members } = await supabase
    .from('team_members')
    .select('member_name, member_index')
    .eq('team_id', teamId)
    .order('member_index');

  return {
    ...team,
    members: members ? members.map((m) => m.member_name) : [],
  };
}

export async function getSelectedPS(teamId) {
  const { data } = await supabase
    .from('problem_statements')
    .select('*')
    .eq('selected_by', teamId)
    .maybeSingle();
  return data || null;
}

export async function selectPS(teamId, psId) {
  // First deselect any current selection
  await supabase
    .from('problem_statements')
    .update({ selected_by: null })
    .eq('selected_by', teamId);

  // Then select the new one
  const { error } = await supabase
    .from('problem_statements')
    .update({ selected_by: teamId })
    .eq('id', psId);

  return !error;
}

export async function deselectPS(teamId) {
  const { error } = await supabase
    .from('problem_statements')
    .update({ selected_by: null })
    .eq('selected_by', teamId);
  return !error;
}

export async function getProblemsByDept(dept) {
  const { data } = await supabase
    .from('problem_statements')
    .select('*')
    .eq('department', dept)
    .order('id');
  return data || [];
}

export async function getAllTeams() {
  const { data } = await supabase
    .from('teams')
    .select('*')
    .order('registered_at', { ascending: false });
  return data || [];
}

export async function getAllPS() {
  const { data } = await supabase
    .from('problem_statements')
    .select('*')
    .order('department, id');
  return data || [];
}

export function logout() {
  localStorage.removeItem('hackverse_session');
  window.location.href = '/';
}

// ─── MENTOR SYSTEM HELPERS ───

export function requireMentorAuth() {
  const session = getSession();
  if (!session || !session.isMentor) {
    window.location.href = '/login.html';
    return null;
  }
  return session;
}

export async function getMentorsByDept(dept) {
  // Get mentors
  const { data: mentors } = await supabase
    .from('mentors')
    .select('*')
    .eq('department', dept)
    .order('name');

  if (!mentors) return [];

  // Get assignment counts
  const { data: assignments } = await supabase
    .from('mentor_assignments')
    .select('mentor_id');

  const counts = {};
  (assignments || []).forEach((a) => {
    counts[a.mentor_id] = (counts[a.mentor_id] || 0) + 1;
  });

  return mentors.map((m) => ({
    ...m,
    assignedCount: counts[m.id] || 0,
    slotsAvailable: (m.max_teams || 4) - (counts[m.id] || 0),
  }));
}

export async function getTeamMentor(teamId) {
  const { data } = await supabase
    .from('mentor_assignments')
    .select('*, mentors:mentor_id(*)')
    .eq('team_id', teamId)
    .maybeSingle();
  return data ? data.mentors : null;
}

export async function assignMentor(teamId, mentorId) {
  // Check mentor capacity
  const { count } = await supabase
    .from('mentor_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', mentorId);

  if (count >= 4) {
    return { success: false, message: 'This mentor already has 4 teams assigned.' };
  }

  // Check if team already has a mentor
  const { data: existing } = await supabase
    .from('mentor_assignments')
    .select('id')
    .eq('team_id', teamId)
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Your team already has a mentor assigned.' };
  }

  // Assign
  const { error } = await supabase
    .from('mentor_assignments')
    .insert({ mentor_id: mentorId, team_id: teamId });

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function getSubmission(teamId) {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('team_id', teamId)
    .maybeSingle();
  return data || null;
}

export async function upsertSubmission(teamId, { github_url, readme_desc, youtube_url }) {
  // Check if submission exists
  const existing = await getSubmission(teamId);

  if (existing) {
    const { error } = await supabase
      .from('submissions')
      .update({ github_url, readme_desc, youtube_url, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);
    return !error;
  } else {
    const { error } = await supabase
      .from('submissions')
      .insert({ team_id: teamId, github_url, readme_desc, youtube_url });
    return !error;
  }
}

export async function getAllMentors() {
  const { data } = await supabase
    .from('mentors')
    .select('*')
    .order('department, name');
  return data || [];
}

// ─── POPULATE NAV (shared across all app pages) ───
export function initAppNav(session) {
  if (!session) return;

  const initials = session.leaderName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatar = document.getElementById('nav-avatar');
  const userName = document.getElementById('nav-user-name');
  const userDept = document.getElementById('nav-user-dept');
  const logoutBtn = document.getElementById('logout-btn');

  if (avatar) avatar.textContent = initials;
  if (userName) userName.textContent = session.leaderName;
  if (userDept) userDept.textContent = session.departmentLabel || session.department;
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// ─── TOAST ───
export function showToast(message, type = 'success') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }

  toast.className = `app-toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${message}`;
  void toast.offsetWidth;
  toast.classList.add('visible');

  setTimeout(() => toast.classList.remove('visible'), 3500);
}

// Department display names
export const DEPT_NAMES = {
  cse: 'CSE',
  'cse-aiml': 'CSE - AIML',
  'cse-ds': 'CSE - DS',
  ise: 'ISE',
  ece: 'ECE',
  mech: 'MECH',
  civil: 'CIVIL',
};
