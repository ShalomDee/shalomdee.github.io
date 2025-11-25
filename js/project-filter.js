// Project filtering functionality
class ProjectFilter {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.projectIntro = document.getElementById('projectIntro');
        this.projectGrid = document.querySelector('.project-grid');
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Wait for projects to be loaded
        document.addEventListener('projectsLoaded', () => {
            this.projects = document.querySelectorAll('.project-grid .project');
            this.hideAllProjects();
            this.attachEventListeners();
            this.initialized = true;
        });
    }

    hideAllProjects() {
        this.projects.forEach(project => {
            project.style.display = 'none';
        });
    }

    showProjectsByCategory(category) {
        let visibleCount = 0;

        this.projects.forEach(project => {
            const categories = project.getAttribute('data-category');
            if (categories && categories.includes(category)) {
                project.style.display = 'grid';
                visibleCount++;
            } else {
                project.style.display = 'none';
            }
        });

        return visibleCount;
    }

    setActiveButton(activeButton) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    handleFilterClick(button) {
        const filter = button.getAttribute('data-filter');

        // Hide intro text
        if (this.projectIntro) {
            this.projectIntro.style.display = 'none';
        }

        // Show filtered projects
        this.showProjectsByCategory(filter);

        // Update active button
        this.setActiveButton(button);
    }

    attachEventListeners() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleFilterClick(button);
            });
        });
    }
}

// Initialize filter when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const filter = new ProjectFilter();
        filter.init();
    });
} else {
    const filter = new ProjectFilter();
    filter.init();
}