// Utility functions
(function() {
    'use strict';

    // Add counter-reset for sections
    function initCounterReset() {
        document.body.style.counterReset = 'section';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounterReset);
    } else {
        initCounterReset();
    }
})();