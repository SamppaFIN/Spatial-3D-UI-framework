function initMobileControls() {
    // Only run on mobile/tablet viewports
    if (window.innerWidth > 768) return;

    const controlsPanel = document.querySelector('.demo-controls');
    if (!controlsPanel) return;

    // Check if button already exists
    if (document.getElementById('mobile-controls-toggle')) return;

    // Create Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'mobile-controls-toggle';
    toggleBtn.innerHTML = '⚙️';
    toggleBtn.title = 'Toggle Controls';

    // Initial State: Hidden
    // The CSS defines .demo-controls as distinct from desktop, initially transform translated 110%

    toggleBtn.addEventListener('click', () => {
        controlsPanel.classList.toggle('mobile-visible');
        toggleBtn.classList.toggle('active');

        if (toggleBtn.classList.contains('active')) {
            toggleBtn.innerHTML = '✕';
        } else {
            toggleBtn.innerHTML = '⚙️';
        }
    });

    document.body.appendChild(toggleBtn);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}
