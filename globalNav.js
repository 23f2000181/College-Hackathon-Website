/**
 * Global Navigation Control
 * Adds Back, Home, and Forward buttons to all pages except the landing page.
 */
function initGlobalNav() {
  const path = window.location.pathname;
  // Exclude landing page / index.html
  if (path === '/' || path === '/index.html' || path === '' || path.endsWith('/index.html')) {
    // Basic check for root-level index
    const isRoot = path === '/' || path === '/index.html' || path === '';
    const isRootInSubdir = path.split('/').pop() === 'index.html' && path.split('/').length <= 2;
    
    // Additional check: if the page has the "hero" class on body, it's likely the landing page
    if (isRoot || document.body.classList.contains('hero-page')) {
      return;
    }
  }

  // Double check we're not on the actual landing page by checking for unique hero elements
  if (document.querySelector('.hero-title')) return;

  // Prevent duplicate insertion
  if (document.querySelector('.global-control-nav')) return;

  const navDiv = document.createElement('div');
  navDiv.className = 'global-control-nav';
  
  navDiv.innerHTML = `
    <button class="gnav-btn" onclick="window.history.back()" title="Go Back">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <a href="/" class="gnav-btn" title="Go Home">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </a>
    <button class="gnav-btn" onclick="window.history.forward()" title="Go Forward">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>
    </button>
  `;

  document.body.appendChild(navDiv);

  // Inject Styles
  if (!document.getElementById('global-nav-style')) {
    const style = document.createElement('style');
    style.id = 'global-nav-style';
    style.textContent = `
      .global-control-nav {
        position: fixed;
        top: 24px;
        left: 24px;
        z-index: 10000;
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 6px 14px;
        border-radius: 100px;
        border: 1px solid rgba(255, 0, 228, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: gnav-fade-in 0.5s ease-out;
      }

      @keyframes gnav-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .gnav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        color: #1a1d2e;
        text-decoration: none;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.25s ease;
        border-radius: 50%;
      }
      
      .gnav-btn:hover {
        background: rgba(255, 0, 228, 0.08);
        color: #ff00e4;
        transform: scale(1.1);
      }
      
      .gnav-btn:active {
        transform: scale(0.92);
      }
  
      @media (max-width: 768px) {
        .global-control-nav {
           top: 16px;
           left: 16px;
           gap: 6px;
           padding: 4px 10px;
           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .gnav-btn {
           width: 32px;
           height: 32px;
        }
        .gnav-btn svg {
           width: 18px;
           height: 18px;
        }
      }

      /* Dark mode support if theme changes */
      [data-theme="dark"] .global-control-nav {
        background: rgba(15, 15, 25, 0.8);
        border: 1px solid rgba(255, 0, 228, 0.3);
        color: #fff;
      }
      [data-theme="dark"] .gnav-btn {
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }
}

// Handle auto-initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalNav);
} else {
  initGlobalNav();
}

// Also export for programmatic use
if (typeof exports !== 'undefined') {
  exports.initGlobalNav = initGlobalNav;
}
