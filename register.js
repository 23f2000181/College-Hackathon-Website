/* ═══════════════════════════════════════════════
   HackVerse — Register Page Logic
   ═══════════════════════════════════════════════ */

// ─── DOM ELEMENTS ───
const form = document.getElementById('register-form');
const leaderNameInput = document.getElementById('leader-name');
const usnInput = document.getElementById('usn');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const departmentSelect = document.getElementById('department');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const member1Input = document.getElementById('member-1');
const member2Input = document.getElementById('member-2');
const member3Input = document.getElementById('member-3');
const member4Input = document.getElementById('member-4');
const teamCountEl = document.getElementById('team-count');
const submitBtn = document.getElementById('submit-btn');

// ─── AUTO-FILL TEAM LEADER AS MEMBER 1 ───
leaderNameInput.addEventListener('input', () => {
  member1Input.value = leaderNameInput.value;
  updateTeamCount();
});

// ─── TEAM COUNT TRACKER ───
function updateTeamCount() {
  const members = [
    member1Input.value.trim(),
    member2Input.value.trim(),
    member3Input.value.trim(),
    member4Input.value.trim(),
  ];
  const filled = members.filter((m) => m.length > 0).length;

  teamCountEl.textContent = `${filled} / 4`;
  teamCountEl.classList.remove('valid', 'invalid');

  if (filled === 4) {
    teamCountEl.classList.add('valid');
  } else if (filled > 0) {
    teamCountEl.classList.add('invalid');
  }

  // Update member number indicators
  [member2Input, member3Input, member4Input].forEach((input, idx) => {
    const numEl = document.getElementById(`num-${idx + 2}`);
    if (numEl) {
      numEl.classList.toggle('filled', input.value.trim().length > 0);
    }
  });
}

[member2Input, member3Input, member4Input].forEach((input) => {
  input.addEventListener('input', updateTeamCount);
});

// ─── PASSWORD TOGGLE ───
function setupPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (!toggle || !input) return;

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
}

setupPasswordToggle('toggle-password', 'password');
setupPasswordToggle('toggle-confirm-password', 'confirm-password');

// ─── VALIDATION ───
function showError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) error.classList.add('visible');
}

function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) error.classList.remove('visible');
}

function clearAllErrors() {
  document.querySelectorAll('.form-input.error').forEach((el) => el.classList.remove('error'));
  document.querySelectorAll('.form-select.error').forEach((el) => el.classList.remove('error'));
  document.querySelectorAll('.form-error.visible').forEach((el) => el.classList.remove('visible'));
}

function validateForm() {
  clearAllErrors();
  let isValid = true;

  // Team Leader Name
  if (!leaderNameInput.value.trim()) {
    showError('leader-name', 'leader-name-error');
    isValid = false;
  }

  // USN
  if (!usnInput.value.trim()) {
    showError('usn', 'usn-error');
    isValid = false;
  }

  // Phone
  const phone = phoneInput.value.trim().replace(/[\s\-\(\)\+]/g, '');
  if (!phone || phone.length < 10) {
    showError('phone', 'phone-error');
    isValid = false;
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
    showError('email', 'email-error');
    isValid = false;
  }

  // Department
  if (!departmentSelect.value) {
    departmentSelect.classList.add('error');
    document.getElementById('department-error').classList.add('visible');
    isValid = false;
  }

  // Password
  if (!passwordInput.value || passwordInput.value.length < 6) {
    showError('password', 'password-error');
    isValid = false;
  }

  // Confirm Password
  if (confirmPasswordInput.value !== passwordInput.value) {
    showError('confirm-password', 'confirm-password-error');
    isValid = false;
  }

  // Team Members (all 4 must be filled)
  const members = [
    member1Input.value.trim(),
    member2Input.value.trim(),
    member3Input.value.trim(),
    member4Input.value.trim(),
  ];

  const filledMembers = members.filter((m) => m.length > 0);
  if (filledMembers.length !== 4) {
    document.getElementById('team-error').classList.add('visible');
    // Highlight empty member fields
    if (!member2Input.value.trim()) member2Input.classList.add('error');
    if (!member3Input.value.trim()) member3Input.classList.add('error');
    if (!member4Input.value.trim()) member4Input.classList.add('error');
    isValid = false;
  }

  return isValid;
}

// ─── TOAST NOTIFICATIONS ───
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = toast.querySelector('.toast-icon');
  const msg = toast.querySelector('.toast-message');

  icon.textContent = type === 'success' ? '✓' : '✕';
  msg.textContent = message;

  toast.className = `toast ${type}`;
  // Trigger reflow
  void toast.offsetWidth;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

// ─── CHECK IF EMAIL ALREADY REGISTERED (Supabase) ───
import { supabase } from '/js/supabase.js';

async function isEmailRegistered(email) {
  const { data } = await supabase
    .from('teams')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return !!data;
}

// ─── FORM SUBMISSION ───
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please fix the errors above', 'error');
    return;
  }

  // Show loading state
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  // Check if email already exists in Supabase
  const emailTaken = await isEmailRegistered(emailInput.value.trim());
  if (emailTaken) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    showError('email', 'email-error');
    document.getElementById('email-error').textContent = 'This email is already registered';
    showToast('This email is already registered', 'error');
    return;
  }

  // Insert team into Supabase
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      leader_name: leaderNameInput.value.trim(),
      usn: usnInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      department: departmentSelect.value,
      department_label: departmentSelect.options[departmentSelect.selectedIndex].text,
      password: passwordInput.value,
    })
    .select()
    .single();

  if (teamError) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    showToast('Registration failed: ' + teamError.message, 'error');
    return;
  }

  // Insert team members
  const members = [
    member1Input.value.trim(),
    member2Input.value.trim(),
    member3Input.value.trim(),
    member4Input.value.trim(),
  ];

  const memberRows = members.map((name, i) => ({
    team_id: team.id,
    member_name: name,
    member_index: i + 1,
  }));

  const { error: membersError } = await supabase
    .from('team_members')
    .insert(memberRows);

  if (membersError) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    showToast('Error saving team members: ' + membersError.message, 'error');
    return;
  }

  // Reset loading
  submitBtn.classList.remove('loading');
  submitBtn.disabled = false;

  showToast('Team registered successfully! Redirecting...', 'success');

  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 2000);
});

// ─── REAL-TIME FIELD VALIDATION (clear errors on input) ───
const fieldsWithErrors = [
  ['leader-name', 'leader-name-error'],
  ['usn', 'usn-error'],
  ['phone', 'phone-error'],
  ['email', 'email-error'],
  ['password', 'password-error'],
  ['confirm-password', 'confirm-password-error'],
  ['member-2', 'team-error'],
  ['member-3', 'team-error'],
  ['member-4', 'team-error'],
];

fieldsWithErrors.forEach(([inputId, errorId]) => {
  const input = document.getElementById(inputId);
  if (input) {
    input.addEventListener('input', () => {
      clearError(inputId, errorId);
    });
  }
});

departmentSelect.addEventListener('change', () => {
  departmentSelect.classList.remove('error');
  document.getElementById('department-error').classList.remove('visible');
});

// ─── INITIAL STATE ───
updateTeamCount();
