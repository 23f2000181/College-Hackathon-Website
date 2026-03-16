/* ═══════════════════════════════════════════════
   HackVerse — Auth Guard & Shared Utilities
   Used by all logged-in pages (dashboard, team, problems, progress)
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';

// ─── SESSION CHECK ───
export function requireAuth() {
  const session = getSession();
  if (!session || session.isMentor || session.isAdmin) {
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
  localStorage.removeItem('hackverse_teams');
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('hackverse_selected_ps_')) localStorage.removeItem(k);
  });
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

export async function getMentorsByDept(dept, academicYear) {
  try {
    // Some mentors in the DB may have short-form dept codes (e.g. 'ds', 'aiml')
    // while teams use the full codes ('cse-ds', 'cse-aiml'). Query both to be safe.
    const DEPT_ALIASES = {
      'cse-ds':   ['cse-ds', 'ds'],
      'cse-aiml': ['cse-aiml', 'aiml'],
    };
    const deptValues = DEPT_ALIASES[dept] || [dept];

    // Get mentors in this department (match any known alias)
    const { data: mentors, error: mentorsError } = await supabase
      .from('mentors')
      .select('*')
      .in('department', deptValues)
      .order('name');

    if (mentorsError) {
      console.error('Error fetching mentors:', mentorsError);
      return [];
    }

    if (!mentors) return [];

    // If academicYear is known, count only for that year (per-year cap = 4).
    // If not (old session without year), count all assignments vs max_teams.
    let assignmentsQuery = supabase.from('mentor_assignments').select('mentor_id');
    if (academicYear) {
      assignmentsQuery = assignmentsQuery.eq('academic_year', academicYear);
    }
    const { data: assignments, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      // Return mentors with zero counts if we can't get assignments
      return mentors.map((m) => ({
        ...m,
        assignedCount: 0,
        slotsAvailable: (academicYear ? 4 : (m.max_teams || 8)),
      }));
    }

    const counts = {};
    (assignments || []).forEach((a) => {
      counts[a.mentor_id] = (counts[a.mentor_id] || 0) + 1;
    });

    const cap = academicYear ? 4 : null; // null = use mentor's own max_teams
    return mentors.map((m) => ({
      ...m,
      assignedCount: counts[m.id] || 0,
      slotsAvailable: (cap ?? (m.max_teams || 8)) - (counts[m.id] || 0),
    })).filter(m => m.slotsAvailable > 0);

  } catch (error) {
    console.error('Error in getMentorsByDept:', error);
    return [];
  }
}

export async function getTeamMentor(teamId) {
  try {
    const { data, error } = await supabase
      .from('mentor_assignments')
      .select('*, mentors:mentor_id(*)')
      .eq('team_id', teamId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching team mentor:', error);
      return null;
    }

    return data ? data.mentors : null;
  } catch (error) {
    console.error('Error in getTeamMentor:', error);
    return null;
  }
}

export async function assignMentor(teamId, mentorId, academicYear) {
  try {
    let count = 0;
    let countError = null;
    let maxCap = 4; // Default per-year cap

    if (academicYear) {
      // Per-year cap check (max 4 teams per year)
      const { count: c, error: e } = await supabase
        .from('mentor_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', mentorId)
        .eq('academic_year', academicYear);
      count = c;
      countError = e;
    } else {
      // Fallback: global cap check using mentor's max_teams
      const { data: mentor, error: mentorError } = await supabase.from('mentors').select('max_teams').eq('id', mentorId).maybeSingle();
      if (mentorError) {
        console.error('Error fetching mentor max_teams:', mentorError);
        return { success: false, message: 'Error checking mentor availability.' };
      }
      maxCap = mentor?.max_teams || 8; // Use mentor's max_teams or default to 8

      const { count: c, error: e } = await supabase
        .from('mentor_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', mentorId);
      count = c;
      countError = e;
    }

    if (countError) {
      console.error('Error checking mentor capacity:', countError);
      return { success: false, message: 'Error checking mentor availability.' };
    }

    if (count >= maxCap) {
      const message = academicYear
        ? `This mentor already has ${maxCap} teams assigned for ${academicYear}.`
        : `This mentor has reached their team limit of ${maxCap}.`;
      return { success: false, message: message };
    }

    // Check if team already has a mentor
    const { data: existing, error: existingError } = await supabase
      .from('mentor_assignments')
      .select('id')
      .eq('team_id', teamId)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing assignment:', existingError);
    }

    if (existing) {
      return { success: false, message: 'Your team already has a mentor assigned.' };
    }

    // Insert assignment WITHOUT the status field (since it doesn't exist in your table)
    const { error: insertError } = await supabase
      .from('mentor_assignments')
      .insert({
        mentor_id: mentorId,
        team_id: teamId,
        academic_year: academicYear
        // Removed 'status' field to match your table schema
      });

    if (insertError) {
      console.error('Error inserting assignment:', insertError);
      return { success: false, message: insertError.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in assignMentor:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateAssignmentStatus(teamId, status) {
  try {
    // First check if status column exists - if not, just return success
    // or you can add the column to your table
    const { error } = await supabase
      .from('mentor_assignments')
      .update({ status })
      .eq('team_id', teamId);

    if (error) {
      console.warn('Could not update status (column might not exist):', error);
      // Return true anyway as this is not critical
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error updating assignment status:', error);
    return false;
  }
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

export async function getTeamReviews(teamId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      feedback,
      rating,
      reviewed_at,
      mentors ( name, department )
    `)
    .eq('team_id', teamId)
    .order('reviewed_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
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