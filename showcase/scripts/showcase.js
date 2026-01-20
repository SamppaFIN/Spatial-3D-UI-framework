// 🌸♾️ Spatial UI 3D Showcase - Shared JavaScript

/**
 * Smooth scroll navigation
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = target.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Navbar scroll effect
 */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.setAttribute('aria-expanded',
            menu.classList.contains('active') ? 'true' : 'false'
        );
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/**
 * Code copy functionality
 */
function initCodeCopy() {
    document.querySelectorAll('.code-copy-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const codeBlock = button.closest('.code-block');
            const code = codeBlock.querySelector('pre')?.textContent || '';

            try {
                await navigator.clipboard.writeText(code);
                const originalText = button.textContent;
                button.textContent = '✓ Copied!';
                button.style.background = 'var(--cosmic-cyan)';
                button.style.color = 'var(--cosmic-black)';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    button.style.color = '';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                button.textContent = '✗ Failed';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }
        });
    });
}

/**
 * Intersection Observer for fade-in animations
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .feature-card').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Active navigation link highlighting
 */
function initActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * Lazy load iframes (for demo embeds)
 */
function initLazyIframes() {
    const iframeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const iframe = entry.target;
                if (iframe.dataset.src) {
                    iframe.src = iframe.dataset.src;
                    iframe.removeAttribute('data-src');
                }
                iframeObserver.unobserve(iframe);
            }
        });
    });

    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
        iframeObserver.observe(iframe);
    });
}

/**
 * Initialize all showcase features
 */
function initShowcase() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runInitializers();
        });
    } else {
        runInitializers();
    }
}

function runInitializers() {
    initSmoothScroll();
    initNavbarScroll();
    initMobileMenu();
    initCodeCopy();
    initScrollAnimations();
    initActiveNavigation();
    initLazyIframes();

    console.log('🌸♾️ Spatial UI 3D Showcase initialized');
}

// Auto-initialize
initShowcase();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSmoothScroll,
        initNavbarScroll,
        initMobileMenu,
        initCodeCopy,
        initScrollAnimations,
        initActiveNavigation,
        initLazyIframes
    };
}
