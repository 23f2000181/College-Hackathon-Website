/**
 * Global Navigation Control - Unified Premium Header
 * Merges all navigation elements into a single, high-end glassy header.
 */
function initGlobalNav() {
  const isLandingPage = window.location.pathname === '/' || 
                        window.location.pathname === '/index.html' || 
                        window.location.pathname.endsWith('/index.html') ||
                        document.querySelector('.hero');

  // Enforce One Header and Premium Styles
  const styleTagId = 'global-nav-unified-style';
  if (!document.getElementById(styleTagId)) {
    const style = document.createElement('style');
    style.id = styleTagId;
    style.textContent = `
      /* Unified Navbar Styles */
      .gnav-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 40px;
        backdrop-filter: blur(25px) saturate(180%);
        -webkit-backdrop-filter: blur(25px) saturate(180%);
        background: rgba(248, 249, 252, 0.95);
        border-bottom: 2px solid rgba(255, 122, 51, 0.2);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
        font-family: 'Outfit', sans-serif;
        transition: all 0.3s ease;
      }

      /* Premium Dashboard Mode (Overrides) */
      .gnav-navbar.dashboard-mode { height: 70px; border-bottom: 1px solid rgba(255, 122, 51, 0.15); }

      /* GLOBAL TOAST FIX — Ensure notifications appear BELOW the header */
      .toast, .app-toast, .iziToast-wrapper {
        top: 85px !important;
        z-index: 1000000 !important;
      }

      .gnav-left { display: flex; align-items: center; gap: 20px; flex: 1; }
      .gnav-right { display: flex; align-items: center; gap: 20px; flex: 1; justify-content: flex-end; }
      .gnav-center { display: flex; align-items: center; justify-content: center; gap: 15px; flex: 1.5; }
      
      /* Non-Dashboard Header Layout */
      .gnav-navbar.simple .gnav-center { flex: 0; display: none; }
      .gnav-navbar.simple .gnav-right { flex: 1; }

      .gnav-logo { display: flex; align-items: center; text-decoration: none; gap: 12px; }
      .gnav-college-logo { height: 40px; width: auto; border-radius: 50%; }
      .gnav-logo-text { display: flex; flex-direction: column; line-height: 1.1; }
      .gnav-logo-main { font-size: 1.1rem; font-weight: 900; color: #FF7A33 !important; }
      .gnav-logo-sub { font-size: 0.55rem; font-weight: 600; color: #4A5068; }

      .gnav-controls { display: flex; background: rgba(0, 0, 0, 0.04); padding: 4px; border-radius: 100px; gap: 4px; }
      .gnav-ctrl-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #4A5068; cursor: pointer; transition: all 0.2s; }
      .gnav-ctrl-btn:hover { background: #fff; color: #FF7A33; }

      .gnav-badge { padding: 6px 16px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; background: linear-gradient(135deg, rgba(255, 0, 228, 0.1), rgba(51, 204, 255, 0.1)); border: 1px solid rgba(168, 85, 247, 0.2); color: #6366f1; display: flex; align-items: center; gap: 8px; }
      .gnav-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #FF00E4; animation: gnavPulse 2s infinite; }
      @keyframes gnavPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

      .gnav-user { display: flex; align-items: center; gap: 12px; padding: 6px 6px 6px 16px; background: #fff; border-radius: 100px; border: 1px solid rgba(0,0,0,0.05); margin-left: auto; }
      .gnav-user-name { font-size: 0.85rem; font-weight: 700; color: #1A1D2E; }
      .gnav-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #FF00E4, #33CCFF); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
      .gnav-logout { padding: 10px 18px; border-radius: 12px; background: rgba(255, 68, 68, 0.05); border: 1px solid rgba(255, 68, 68, 0.1); color: #ff4444; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }

      @media (max-width: 900px) {
        .gnav-logo-text, .gnav-user-text { display: none; }
        .gnav-navbar { padding: 0 15px; }
      }
    `;
    document.head.appendChild(style);
  }

  if (isLandingPage) {
    document.body.classList.add('landing-page');
    return;
  }

  // Dashboard Logic
  const path = window.location.pathname;
  const isDashboard = path.includes('dashboard.html') || path.includes('/pages/admin.html');
  const session = JSON.parse(localStorage.getItem('hackverse_session') || 'null');
  
  if (!document.querySelector('.gnav-navbar')) {
    const nav = document.createElement('nav');
    nav.className = 'gnav-navbar' + (isDashboard ? ' dashboard-mode' : '');
    
    // Left: Branding
    const left = `
      <div class="gnav-left">
        <a href="/" class="gnav-logo">
          <img src="/logo.jpeg" alt="SVIT Logo" class="gnav-college-logo" />
          <div class="gnav-logo-text">
            <span class="gnav-logo-main">SAI VIDYA</span>
            <span class="gnav-logo-sub">INSTITUTE OF TECHNOLOGY</span>
          </div>
        </a>
      </div>
    `;

    // Center: Controls + Badge (Dashboard Mode Only)
    let badgeHtml = '';
    if (isDashboard && session) {
      const type = session.isAdmin ? 'Admin' : session.isMentor ? 'Mentor' : 'Team';
      badgeHtml = `
        <div class="gnav-badge">
          <span class="gnav-badge-dot"></span>
          <span>${type} Dashboard</span>
        </div>
      `;
    }

    const centerHtml = `
      <div class="gnav-center">
        <div class="gnav-controls">
          <button class="gnav-ctrl-btn" onclick="window.history.back()" title="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <a href="/" class="gnav-ctrl-btn" title="Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </a>
          <button class="gnav-ctrl-btn" onclick="window.history.forward()" title="Forward">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
        ${badgeHtml}
      </div>
    `;

    // Right: User + Logout (Dashboard Mode Only) or Controls (Simple Mode)
    let rightHtml = '';
    const controlsHtml = `
      <div class="gnav-controls">
        <button class="gnav-ctrl-btn" onclick="window.history.back()" title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <a href="/" class="gnav-ctrl-btn" title="Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </a>
        <button class="gnav-ctrl-btn" onclick="window.history.forward()" title="Forward">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    `;

    if (isDashboard && session) {
      const initials = session.leaderName ? session.leaderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
      rightHtml = `
        <div class="gnav-right">
          <div class="gnav-user">
            <div class="gnav-user-text" style="display:flex; flex-direction:column; align-items:flex-end; line-height:1.2; margin-right:8px;">
              <span class="gnav-user-name" style="font-size:0.85rem; font-weight:700;">${session.leaderName}</span>
              <span class="gnav-user-dept" style="font-size:0.65rem; color:#6B7280; text-transform:uppercase;">${session.departmentLabel || session.department || ''}</span>
            </div>
            <div class="gnav-avatar">${initials}</div>
          </div>
          <button class="gnav-logout" id="gnav-logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Log Out</span>
          </button>
        </div>
      `;
    } else {
      rightHtml = `
        <div class="gnav-right">
          ${controlsHtml}
          ${path.includes('login.html') ? '' : '<a href="/login.html" class="gnav-logout" style="color:#FF7A33; border-color:rgba(255,122,51,0.2); background:rgba(255,122,51,0.05); height: 36px; padding: 0 16px;">Log In</a>'}
        </div>
      `;
    }

    nav.innerHTML = left + centerHtml + rightHtml;
    document.body.prepend(nav);

    // Logout logic
    const logoutBtn = document.getElementById('gnav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('hackverse_session');
        window.location.href = '/';
      });
    }
  }
}

// Ensure smooth entry for main content
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    const main = document.querySelector('main') || document.querySelector('.page-container') || document.querySelector('.dashboard');
    if (main) {
      main.style.opacity = '0';
      main.style.transform = 'translateY(10px)';
      main.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => {
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
      }, 100);
    }
  }
});

initGlobalNav();
document.addEventListener('DOMContentLoaded', initGlobalNav);
window.addEventListener('load', initGlobalNav);
