/**
 * Global Navigation Control
 * Adds Back, Home, and Forward buttons to ALL pages in the top-right corner.
 */
function initGlobalNav() {
  const path = window.location.pathname;
  
  // Prevent duplicate insertion
  if (document.querySelector('.global-control-nav')) return;

  const navDiv = document.createElement('div');
  navDiv.className = 'global-control-nav';
  
  navDiv.innerHTML = `
    <button class="gnav-btn" onclick="window.history.back()" title="Go Back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <a href="/" class="gnav-btn" title="Go Home">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </a>
    <button class="gnav-btn" onclick="window.history.forward()" title="Go Forward">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
        top: 80px; /* Positioned below the typical header height */
        right: 24px;
        z-index: 10000;
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 5px 12px;
        border-radius: 100px;
        border: 1px solid rgba(255, 122, 51, 0.2);
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
        width: 36px;
        height: 36px;
        color: #1a1d2e;
        text-decoration: none;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.25s ease;
        border-radius: 50%;
      }
      
      .gnav-btn:hover {
        background: rgba(255, 122, 51, 0.08); /* Use orange for hover */
        color: #FF7A33;
        transform: scale(1.1);
      }
      
      .gnav-btn:active {
        transform: scale(0.92);
      }
  
      @media (max-width: 768px) {
        .global-control-nav {
           top: 70px;
           right: 16px;
           gap: 4px;
           padding: 4px 8px;
           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .gnav-btn {
           width: 30px;
           height: 30px;
        }
        .gnav-btn svg {
           width: 17px;
           height: 17px;
        }
      }

      /* Dark mode/Hero page compatibility */
      body.hero-page .global-control-nav {
        background: rgba(15, 15, 25, 0.5);
        border-color: rgba(255, 122, 51, 0.3);
      }
      body.hero-page .gnav-btn {
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

// Export for module systems
if (typeof exports !== 'undefined') {
  exports.initGlobalNav = initGlobalNav;
}
