// Mobile hamburger menu functionality
(function() {
    'use strict';

    const hamburgerButton = document.querySelector('.hamburger-button');
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const body = document.body;

    if (!hamburgerButton || !mobileSidebar) {
        console.warn('Mobile menu elements not found');
        return;
    }

    // Toggle menu
    function toggleMenu() {
        hamburgerButton.classList.toggle('active');
        mobileSidebar.classList.toggle('open');
        body.style.overflow = mobileSidebar.classList.contains('open') ? 'hidden' : 'auto';
    }

    // Close menu
    function closeMenu() {
        hamburgerButton.classList.remove('active');
        mobileSidebar.classList.remove('open');
        body.style.overflow = 'auto';
    }

    // Hamburger button click
    hamburgerButton.addEventListener('click', toggleMenu);

    // Close menu when clicking on links
    document.querySelectorAll('.mobile-sidebar a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburgerButton.contains(e.target) && !mobileSidebar.contains(e.target)) {
            closeMenu();
        }
    });
})();