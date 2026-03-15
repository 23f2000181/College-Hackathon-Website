export function initGlobalNav() {
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    return;
  }

  const navDiv = document.createElement('div');
  navDiv.className = 'global-control-nav';
  
  navDiv.innerHTML = `
    <button class="gnav-btn" onclick="window.history.back()" title="Back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <a href="/" class="gnav-btn" title="Home">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </a>
    <button class="gnav-btn" onclick="window.history.forward()" title="Forward">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </button>
  `;

  document.body.appendChild(navDiv);

  if (!document.getElementById('global-nav-style')) {
    const style = document.createElement('style');
    style.id = 'global-nav-style';
    style.textContent = `
      .global-control-nav {
        position: fixed;
        top: 24px;
        left: 24px;
        z-index: 999;
        display: flex;
        gap: 16px;
        align-items: center;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 8px 16px;
        border-radius: 12px;
        border: 1px solid rgba(26, 29, 46, 0.1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }
      
      .gnav-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-family, 'Outfit', sans-serif);
        font-weight: 700;
        font-size: 0.95rem;
        color: #1a1d2e;
        text-decoration: none;
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .gnav-btn:hover {
        transform: scale(1.05);
        color: #ff00e4;
      }
  
      @media (max-width: 768px) {
        .global-control-nav {
           top: 16px;
           left: 16px;
           gap: 12px;
           padding: 6px 12px;
        }
        .gnav-btn {
           font-size: 0.85rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

document.addEventListener('DOMContentLoaded', initGlobalNav);
