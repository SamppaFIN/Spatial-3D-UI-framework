/**
 * Mobile Controls — Unified Panel System
 * 
 * Provides a FAB (Floating Action Button) + bottom-sheet panel
 * for all component demo pages on mobile/tablet viewports (≤768px).
 *
 * Features:
 * - FAB toggle to show/hide controls panel
 * - Swipe-down-to-dismiss gesture
 * - Backdrop overlay (tap to dismiss)
 * - Dynamic panel wrapping (creates .demo-controls if missing)
 * - Body scroll lock when panel is open
 * - Resize-aware (re-checks on orientation change)
 */
(function () {
    'use strict';

    const MOBILE_BREAKPOINT = 768;
    const SWIPE_THRESHOLD = 60; // px to trigger dismiss
    const FAB_ID = 'mobile-controls-toggle';
    const BACKDROP_CLASS = 'mobile-panel-backdrop';
    const PANEL_CLASS = 'demo-controls';
    const VISIBLE_CLASS = 'mobile-visible';
    const BODY_LOCK_CLASS = 'mobile-panel-open';

    let panel = null;
    let toggleBtn = null;
    let backdrop = null;
    let isVisible = false;
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isSwiping = false;

    // ── Main Init ──

    function init() {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        if (document.getElementById(FAB_ID)) return; // already initialized

        panel = findOrCreatePanel();
        if (!panel) return;

        createBackdrop();
        createToggleButton();
        bindPanelSwipe();
        bindResizeHandler();

        // Initial state: hidden
        setVisible(false);
    }

    // ── Panel Discovery / Creation ──

    function findOrCreatePanel() {
        // Try existing .demo-controls first
        let el = document.querySelector('.' + PANEL_CLASS);
        if (el) return el;

        // Try to find any controls-like container
        const candidates = document.querySelectorAll(
            '.controls-panel, [data-controls], aside, .sidebar, .control-group'
        );

        // Use the largest candidate (most likely the main controls)
        let best = null;
        let bestLen = 0;
        candidates.forEach(c => {
            if (c.textContent.length > bestLen && c.offsetParent !== null) {
                best = c;
                bestLen = c.textContent.length;
            }
        });

        if (best) {
            best.classList.add(PANEL_CLASS);
            return best;
        }

        // Last resort: create an empty panel (page has no controls)
        el = document.createElement('div');
        el.className = PANEL_CLASS;
        el.innerHTML = '<p style="color:#888;text-align:center;padding:1rem;">No controls available on this page.</p>';
        document.body.appendChild(el);
        return el;
    }

    // ── Backdrop ──

    function createBackdrop() {
        if (document.querySelector('.' + BACKDROP_CLASS)) return;

        backdrop = document.createElement('div');
        backdrop.className = BACKDROP_CLASS;
        backdrop.addEventListener('click', () => setVisible(false));
        document.body.appendChild(backdrop);
    }

    // ── Toggle Button ──

    function createToggleButton() {
        toggleBtn = document.createElement('button');
        toggleBtn.id = FAB_ID;
        toggleBtn.innerHTML = '⚙️';
        toggleBtn.title = 'Toggle Controls';
        toggleBtn.setAttribute('aria-label', 'Toggle controls panel');
        toggleBtn.setAttribute('aria-expanded', 'false');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setVisible(!isVisible);
        });

        document.body.appendChild(toggleBtn);
    }

    function updateToggleIcon() {
        if (!toggleBtn) return;
        if (isVisible) {
            toggleBtn.innerHTML = '✕';
            toggleBtn.classList.add('active');
            toggleBtn.setAttribute('aria-expanded', 'true');
        } else {
            toggleBtn.innerHTML = '⚙️';
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // ── Visibility ──

    function setVisible(show) {
        isVisible = show;

        if (panel) {
            panel.classList.toggle(VISIBLE_CLASS, show);
        }

        if (backdrop) {
            backdrop.classList.toggle('active', show);
        }

        // Body scroll lock
        document.body.classList.toggle(BODY_LOCK_CLASS, show);

        updateToggleIcon();
    }

    // ── Swipe Gesture ──

    function bindPanelSwipe() {
        if (!panel) return;

        panel.addEventListener('touchstart', onTouchStart, { passive: true });
        panel.addEventListener('touchmove', onTouchMove, { passive: false });
        panel.addEventListener('touchend', onTouchEnd);
    }

    function onTouchStart(e) {
        // Only track swipes starting near the handle (top 60px of panel)
        const touch = e.touches[0];
        const panelRect = panel.getBoundingClientRect();
        const touchFromTop = touch.clientY - panelRect.top;

        if (touchFromTop < 60 || panel.scrollTop <= 0) {
            touchStartY = touch.clientY;
            isSwiping = true;
        } else {
            isSwiping = false;
        }
    }

    function onTouchMove(e) {
        if (!isSwiping) return;

        touchCurrentY = e.touches[0].clientY;
        const delta = touchCurrentY - touchStartY;

        // Only track downward swipes (positive delta)
        if (delta > 0) {
            // Add visual drag feedback
            panel.style.transition = 'none';
            panel.style.transform = `translateY(${delta}px)`;
            e.preventDefault(); // prevent page scroll while swiping panel
        }
    }

    function onTouchEnd() {
        if (!isSwiping) return;

        const delta = touchCurrentY - touchStartY;

        // Reset inline styles
        panel.style.transition = '';
        panel.style.transform = '';

        if (delta > SWIPE_THRESHOLD) {
            setVisible(false);
        }

        isSwiping = false;
        touchStartY = 0;
        touchCurrentY = 0;
    }

    // ── Resize Handler ──

    function bindResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth > MOBILE_BREAKPOINT) {
                    // Back to desktop — clean up mobile UI
                    setVisible(false);
                    destroy();
                } else if (!document.getElementById(FAB_ID)) {
                    // Re-entering mobile breakpoint
                    init();
                }
            }, 250);
        });

        // Also handle orientation change explicitly
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.innerWidth <= MOBILE_BREAKPOINT && !document.getElementById(FAB_ID)) {
                    init();
                }
            }, 300);
        });
    }

    // ── Cleanup (on resize back to desktop) ──

    function destroy() {
        if (toggleBtn) { toggleBtn.remove(); toggleBtn = null; }
        if (backdrop) { backdrop.remove(); backdrop = null; }
        panel = null;
        isVisible = false;
        document.body.classList.remove(BODY_LOCK_CLASS);
        isSwiping = false;
    }

    // ── Bootstrap ──

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

