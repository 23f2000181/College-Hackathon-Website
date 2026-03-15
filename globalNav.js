/**
 * Global Navigation Control
 * Synchronizes header look across all pages to match the landing page.
 * Replaces login/register actions with Back, Home, and Forward navigation.
 */
function initGlobalNav() {
  const isLandingPage = window.location.pathname === '/' || 
                        window.location.pathname === '/index.html' || 
                        window.location.pathname.endsWith('/index.html') ||
                        document.querySelector('.hero');

  // 1. Enforce Orange Logo Branding Everywhere
  const styleTagId = 'global-nav-branding-style';
  if (!document.getElementById(styleTagId)) {
    const style = document.createElement('style');
    style.id = styleTagId;
    style.textContent = `
      .logo-main, .gnav-logo-main { color: #FF7A33 !important; }
      
      /* Internal Page Specific Styles */
      body:not(.landing-page) .app-nav, 
      body:not(.landing-page) .auth-navbar, 
      body:not(.landing-page) .navbar:not(.gnav-navbar) {
        display: none !important;
      }

      body:not(.landing-page) {
        padding-top: 85px !important;
      }

      /* Unified Navbar Styles */
      .gnav-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 40px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background: rgba(248, 249, 252, 0.85);
        border-bottom: 1px solid rgba(26, 29, 46, 0.08);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Outfit', sans-serif;
      }

      .gnav-logo {
        display: flex;
        align-items: center;
        text-decoration: none;
      }

      .gnav-college-logo {
        height: 42px;
        width: auto;
        margin-right: 12px;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(26, 29, 46, 0.1);
      }

      .gnav-logo-text-group {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }

      .gnav-logo-main {
        font-size: 1.1rem;
        font-weight: 900;
        letter-spacing: 0.08em;
      }

      .gnav-logo-sub {
        font-size: 0.55rem;
        font-weight: 600;
        color: #4A5068;
        letter-spacing: 0.12em;
      }

      .gnav-controls {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .gnav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        color: #1a1d2e;
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(26, 29, 46, 0.1);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.25s ease;
      }

      .gnav-btn:hover {
        background: rgba(255, 122, 51, 0.15);
        color: #FF7A33;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 122, 51, 0.15);
      }
      
      .gnav-btn:active {
        transform: scale(0.95);
      }

      @media (max-width: 768px) {
        .gnav-navbar {
          padding: 10px 16px;
          height: 64px;
        }
        .gnav-college-logo {
          height: 32px;
          margin-right: 8px;
        }
        .gnav-logo-main {
          font-size: 0.95rem;
        }
        .gnav-logo-sub {
          display: none; /* Keep it clean on mobile */
        }
        .gnav-controls {
           gap: 6px;
        }
        .gnav-btn {
          width: 34px;
          height: 34px;
        }
        body:not(.landing-page) {
          padding-top: 70px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (isLandingPage) {
    document.body.classList.add('landing-page');
    // Ensure landing page navbar is visible if it was hidden by previous scripts
    const landingNav = document.querySelector('.navbar');
    if (landingNav) landingNav.style.display = 'flex';
    return;
  }

  // 2. Create and Inject the Unified Navbar for Internal Pages
  if (!document.querySelector('.gnav-navbar')) {
    const nav = document.createElement('nav');
    nav.className = 'gnav-navbar';
    nav.innerHTML = `
      <a href="/" class="gnav-logo">
        <img src="/logo.jpeg" alt="SVIT Logo" class="gnav-college-logo" />
        <div class="gnav-logo-text-group">
          <span class="gnav-logo-main">SAI VIDYA</span>
          <span class="gnav-logo-sub">INSTITUTE OF TECHNOLOGY</span>
        </div>
      </a>
      <div class="gnav-controls">
        <button class="gnav-btn" onclick="window.history.back()" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <a href="/" class="gnav-btn" title="Home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </a>
        <button class="gnav-btn" onclick="window.history.forward()" title="Forward">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    `;
    document.body.prepend(nav);
  }
}

// Ensure it runs as early as possible and after DOM is ready
initGlobalNav();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalNav);
} else {
  initGlobalNav();
}
