/* ═══════════════════════════════════════════════
   HackVerse — Auth Guard & Shared Utilities
   Used by all logged-in pages (dashboard, team, problems, progress)
   ═══════════════════════════════════════════════ */

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

export function getTeamData(session) {
  if (!session) return null;
  const teams = JSON.parse(localStorage.getItem('hackverse_teams') || '[]');
  return teams.find((t) => t.id === session.teamId) || null;
}

export function getSelectedPS(teamId) {
  try {
    return JSON.parse(localStorage.getItem('hackverse_selected_ps_' + teamId) || 'null');
  } catch {
    return null;
  }
}

export function selectPS(teamId, ps) {
  localStorage.setItem('hackverse_selected_ps_' + teamId, JSON.stringify(ps));
}

// Get all PS IDs selected by OTHER teams (not the current team)
export function getTakenPSIds(currentTeamId) {
  const teams = JSON.parse(localStorage.getItem('hackverse_teams') || '[]');
  const takenIds = [];

  teams.forEach((team) => {
    if (team.id === currentTeamId) return; // skip own team
    const ps = getSelectedPS(team.id);
    if (ps) takenIds.push(ps.id);
  });

  return takenIds;
}

// Get active problem statements (admin-customized or defaults)
export function getActivePS() {
  try {
    const custom = JSON.parse(localStorage.getItem('hackverse_custom_ps') || 'null');
    if (custom) return custom;
  } catch { /* ignore */ }
  return PROBLEM_STATEMENTS;
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
  // Remove existing toast
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

// ─── PROBLEM STATEMENTS DATA ───
export const PROBLEM_STATEMENTS = {
  cse: [
    { id: 'cse-1', title: 'Smart Campus Navigation System', difficulty: 'Medium', desc: 'Build an indoor navigation system for large campus buildings using BLE beacons and mobile devices.' },
    { id: 'cse-2', title: 'Automated Code Review Tool', difficulty: 'Hard', desc: 'Create an AI-powered tool that reviews code submissions and provides feedback on quality, security, and best practices.' },
    { id: 'cse-3', title: 'Real-time Collaborative Whiteboard', difficulty: 'Medium', desc: 'Develop a collaborative whiteboard application with real-time syncing, drawing tools, and session management.' },
    { id: 'cse-4', title: 'Student Attendance Tracker with Face Recognition', difficulty: 'Hard', desc: 'Build a system that uses facial recognition to automate classroom attendance tracking.' },
    { id: 'cse-5', title: 'Campus Lost & Found Platform', difficulty: 'Easy', desc: 'Create a web platform for students to report and find lost items within the campus.' },
  ],
  'cse-aiml': [
    { id: 'aiml-1', title: 'Sentiment-Based News Aggregator', difficulty: 'Medium', desc: 'Build a news app that classifies articles by sentiment and filters by topic using NLP models.' },
    { id: 'aiml-2', title: 'Medical Image Diagnosis Assistant', difficulty: 'Hard', desc: 'Develop a CNN-based tool that assists doctors in diagnosing diseases from X-ray and MRI scans.' },
    { id: 'aiml-3', title: 'AI Chatbot for College Queries', difficulty: 'Medium', desc: 'Create an intelligent chatbot trained on college FAQs to help students with admissions, fees, and schedules.' },
    { id: 'aiml-4', title: 'Deepfake Detection System', difficulty: 'Hard', desc: 'Build a model that can detect manipulated images and videos with high accuracy.' },
    { id: 'aiml-5', title: 'Predictive Student Performance Model', difficulty: 'Easy', desc: 'Use ML to predict student academic performance based on historical data and behavioral patterns.' },
  ],
  'cse-ds': [
    { id: 'ds-1', title: 'Traffic Flow Prediction Dashboard', difficulty: 'Medium', desc: 'Analyze traffic data and build a dashboard that predicts congestion patterns using time-series models.' },
    { id: 'ds-2', title: 'Social Media Trend Analyzer', difficulty: 'Medium', desc: 'Scrape and analyze social media data to identify trending topics and visualize sentiment shifts over time.' },
    { id: 'ds-3', title: 'E-Commerce Recommendation Engine', difficulty: 'Hard', desc: 'Build a collaborative filtering recommendation system for an e-commerce platform with real-time suggestions.' },
    { id: 'ds-4', title: 'COVID Data Visualization Portal', difficulty: 'Easy', desc: 'Create an interactive dashboard visualizing pandemic data with charts, maps, and statistical insights.' },
    { id: 'ds-5', title: 'Anomaly Detection in Financial Transactions', difficulty: 'Hard', desc: 'Develop a system that detects fraudulent transactions using unsupervised learning algorithms.' },
  ],
  ise: [
    { id: 'ise-1', title: 'Distributed Task Scheduler', difficulty: 'Hard', desc: 'Build a distributed task scheduling system that efficiently assigns and manages tasks across multiple nodes.' },
    { id: 'ise-2', title: 'Online Exam Proctoring System', difficulty: 'Medium', desc: 'Create a browser-based exam platform with anti-cheating measures including tab monitoring and screen recording.' },
    { id: 'ise-3', title: 'Version Control Visualization Tool', difficulty: 'Medium', desc: 'Develop a visual tool that renders Git repository history as interactive graphs and timelines.' },
    { id: 'ise-4', title: 'API Gateway with Rate Limiting', difficulty: 'Medium', desc: 'Build a lightweight API gateway with authentication, rate limiting, and request logging.' },
    { id: 'ise-5', title: 'Bug Tracker & Project Manager', difficulty: 'Easy', desc: 'Create a Kanban-style project management tool with bug tracking, assignment, and sprint planning.' },
  ],
  ece: [
    { id: 'ece-1', title: 'Smart Home Energy Monitor', difficulty: 'Medium', desc: 'Design an IoT-based system that monitors household energy consumption and suggests optimization strategies.' },
    { id: 'ece-2', title: 'Wireless Sensor Mesh Network', difficulty: 'Hard', desc: 'Build a self-healing mesh network of wireless sensors for environmental monitoring applications.' },
    { id: 'ece-3', title: 'Voice-Controlled Home Automation', difficulty: 'Medium', desc: 'Create a voice-controlled system using speech recognition to operate home appliances.' },
    { id: 'ece-4', title: 'FPGA-based Signal Processor Simulator', difficulty: 'Hard', desc: 'Develop a web-based simulator for visualizing and testing basic FPGA signal processing operations.' },
    { id: 'ece-5', title: 'Noise Cancellation Algorithm Visualizer', difficulty: 'Easy', desc: 'Build an interactive tool that demonstrates active noise cancellation algorithms with real-time audio.' },
  ],
  mech: [
    { id: 'mech-1', title: '3D CAD Model Viewer', difficulty: 'Medium', desc: 'Create a web-based 3D viewer for CAD models (STL/OBJ) with rotation, zoom, and measurement tools.' },
    { id: 'mech-2', title: 'Predictive Maintenance Dashboard', difficulty: 'Hard', desc: 'Build a dashboard that predicts machine failures using sensor data and ML-based anomaly detection.' },
    { id: 'mech-3', title: 'Heat Transfer Simulation Tool', difficulty: 'Medium', desc: 'Develop an interactive simulation tool for visualizing conduction, convection, and radiation heat transfer.' },
    { id: 'mech-4', title: 'Supply Chain Optimization Tool', difficulty: 'Medium', desc: 'Create a tool that optimizes supply chain logistics using graph algorithms and route planning.' },
    { id: 'mech-5', title: 'Workshop Inventory Manager', difficulty: 'Easy', desc: 'Build a web app to track workshop tools, materials, and equipment with barcode scanning support.' },
  ],
  civil: [
    { id: 'civil-1', title: 'Construction Project Tracker', difficulty: 'Medium', desc: 'Build a platform for tracking construction project progress with Gantt charts and milestone management.' },
    { id: 'civil-2', title: 'Structural Load Calculator', difficulty: 'Medium', desc: 'Create an interactive tool for calculating beam loads, stress, and deflection with visual diagrams.' },
    { id: 'civil-3', title: 'GIS-based Land Use Mapper', difficulty: 'Hard', desc: 'Develop a GIS application that maps and analyzes land use patterns using satellite data and overlays.' },
    { id: 'civil-4', title: 'Water Distribution Network Simulator', difficulty: 'Hard', desc: 'Build a simulator for designing and analyzing water distribution networks with flow and pressure analysis.' },
    { id: 'civil-5', title: 'Site Safety Checklist App', difficulty: 'Easy', desc: 'Create a digital checklist app for construction site safety inspections with photo documentation.' },
  ],
};

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
