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

  // Enforce Orange Logo Branding and Responsive Styles
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
        min-width: unset !important; /* Ensure no fixed widths on mobile */
      }

      /* Unified Navbar Styles */
      .gnav-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999; /* Ultra high z-index to stay on top */
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 40px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background: rgba(248, 249, 252, 0.9);
        border-bottom: 1px solid rgba(26, 29, 46, 0.08);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Outfit', sans-serif;
      }

      .gnav-logo {
        display: flex;
        align-items: center;
        text-decoration: none;
        flex-shrink: 1;
        min-width: 0;
      }

      .gnav-college-logo {
        height: 40px;
        width: auto;
        margin-right: 10px;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(26, 29, 46, 0.1);
        flex-shrink: 0;
      }

      .gnav-logo-text-group {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
        overflow: hidden;
      }

      .gnav-logo-main {
        font-size: 1.1rem;
        font-weight: 900;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }

      .gnav-logo-sub {
        font-size: 0.55rem;
        font-weight: 600;
        color: #4A5068;
        letter-spacing: 0.08em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .gnav-controls {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-shrink: 0;
        margin-left: 10px;
      }

      .gnav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        color: #1a1d2e;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(26, 29, 46, 0.1);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .gnav-btn:hover {
        background: rgba(255, 122, 51, 0.15);
        color: #FF7A33;
        transform: translateY(-1px);
      }
      
      .gnav-btn:active {
        transform: scale(0.95);
      }

      /* Mobile Adjustments (Standard Mobile) */
      @media (max-width: 768px) {
        .gnav-navbar {
          padding: 8px 12px;
          height: 60px;
        }
        .gnav-college-logo {
          height: 32px;
          margin-right: 8px;
        }
        .gnav-logo-main {
          font-size: 0.95rem;
        }
        .gnav-logo-sub {
          display: block !important;
          font-size: 0.45rem;
          letter-spacing: 0.05em;
        }
        .gnav-controls {
           gap: 8px;
        }
        .gnav-btn {
          width: 34px;
          height: 34px;
        }
        body:not(.landing-page) {
          padding-top: 75px !important;
        }
      }

      /* Extra Small Devices */
      @media (max-width: 400px) {
        .gnav-logo-main {
          font-size: 0.85rem;
        }
        .gnav-logo-sub {
          font-size: 0.4rem;
        }
        .gnav-controls {
           gap: 4px;
        }
        .gnav-btn {
          width: 30px;
          height: 30px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (isLandingPage) {
    document.body.classList.add('landing-page');
    // Ensure landing page navbar is visible
    const landingNav = document.querySelector('.navbar');
    if (landingNav) landingNav.style.display = 'flex';
    return;
  }

  // Create and Inject the Unified Navbar for Internal Pages
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <a href="/" class="gnav-btn" title="Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </a>
        <button class="gnav-btn" onclick="window.history.forward()" title="Forward">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    `;
    document.body.prepend(nav);
  }
}

// Auto-run core logic
initGlobalNav();
document.addEventListener('DOMContentLoaded', initGlobalNav);
window.addEventListener('load', initGlobalNav);
