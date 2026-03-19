/* ═══════════════════════════════════════════════
   HackVerse — Login Page Logic
   ═══════════════════════════════════════════════ */

import { supabase } from '/js/supabase.js';

// ─── DOM ELEMENTS ───
const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');

// ─── PASSWORD TOGGLE ───
const toggle = document.getElementById('toggle-password');
if (toggle) {
  toggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggle.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
}

// ─── TOAST ───
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = toast.querySelector('.toast-icon');
  const msg = toast.querySelector('.toast-message');

  icon.textContent = type === 'success' ? '✓' : '✕';
  msg.textContent = message;

  toast.className = `toast ${type}`;
  void toast.offsetWidth;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

// ─── VALIDATION ───
function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) {
    if (message) error.textContent = message;
    error.classList.add('visible');
  }
}

function clearErrors() {
  document.querySelectorAll('.form-input.error').forEach((el) => el.classList.remove('error'));
  document.querySelectorAll('.form-error.visible').forEach((el) => el.classList.remove('visible'));
}

// ─── FORM SUBMISSION ───
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  let isValid = true;

  // Email
  const email = emailInput.value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showError('email', 'email-error');
    isValid = false;
  }

  // Password
  if (!passwordInput.value) {
    showError('password', 'password-error');
    isValid = false;
  }

  if (!isValid) {
    showToast('Please fill in all fields correctly', 'error');
    return;
  }

  // Show loading
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  // ─── ADMIN LOGIN CHECK ───
  const ADMIN_EMAIL = 'admin@hackverse.com';
  const ADMIN_PASSWORD = 'hackverse2026';

  if (email === ADMIN_EMAIL && passwordInput.value === ADMIN_PASSWORD) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    localStorage.setItem(
      'hackverse_session',
      JSON.stringify({
        isAdmin: true,
        email: ADMIN_EMAIL,
        leaderName: 'Admin',
        loggedInAt: new Date().toISOString(),
      })
    );

    showToast('Welcome, Admin!', 'success');
    setTimeout(() => {
      window.location.href = '/pages/admin/index.html';
    }, 1500);
    return;
  }

  // ─── MENTOR LOGIN CHECK ───
  const { data: mentor, error: mentorError } = await supabase
    .from('mentors')
    .select('*')
    .eq('email', email)
    .eq('password', passwordInput.value)
    .maybeSingle();

  if (mentor) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    localStorage.setItem(
      'hackverse_session',
      JSON.stringify({
        isMentor: true,
        mentorId: mentor.id,
        leaderName: mentor.name,
        email: mentor.email,
        department: mentor.department,
        departmentLabel: mentor.department.toUpperCase(),
        loggedInAt: new Date().toISOString(),
      })
    );

    showToast(`Welcome, ${mentor.name}!`, 'success');
    setTimeout(() => {
      window.location.href = '/pages/mentor/dashboard.html';
    }, 1500);
    return;
  }

  // ─── TEAM LOGIN VIA SUPABASE ───
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('email', email)
    .eq('password', passwordInput.value)
    .maybeSingle();

  submitBtn.classList.remove('loading');
  submitBtn.disabled = false;

  if (error || !team) {
    showError('email', 'email-error', 'Invalid email or password');
    showError('password', 'password-error', 'Invalid email or password');
    showToast('Invalid email or password', 'error');
    return;
  }

  // Fetch team members
  let { data: membersData, error: membersError } = await supabase
    .from('team_members')
    .select('member_name, member_usn, member_index')
    .eq('team_id', team.id)
    .order('member_index');

  // Fallback if member_usn column doesn't exist yet
  if (membersError) {
    const { data: fallback } = await supabase
      .from('team_members')
      .select('member_name, member_index')
      .eq('team_id', team.id)
      .order('member_index');
    membersData = fallback;
  }

  const members = membersData ? membersData.map((m) => m.member_name) : [];
  const memberUsns = membersData ? membersData.map((m) => m.member_usn || '') : [];

  // Login success — store session info
  localStorage.setItem(
    'hackverse_session',
    JSON.stringify({
      teamId: team.id,
      leaderName: team.leader_name,
      email: team.email,
      department: team.department,
      departmentLabel: team.department_label,
      academic_year: team.academic_year,
      usn: team.usn,
      phone: team.phone,
      members: members,
      memberUsns: memberUsns,
      loggedInAt: new Date().toISOString(),
    })
  );

  showToast(`Welcome back, ${team.leader_name}!`, 'success');

  // Redirect to dashboard
  setTimeout(() => {
    window.location.href = '/pages/dashboard.html';
  }, 1500);
});

// ─── CLEAR ERRORS ON INPUT ───
emailInput.addEventListener('input', () => {
  emailInput.classList.remove('error');
  document.getElementById('email-error').classList.remove('visible');
});

passwordInput.addEventListener('input', () => {
  passwordInput.classList.remove('error');
  document.getElementById('password-error').classList.remove('visible');
});
