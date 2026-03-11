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
