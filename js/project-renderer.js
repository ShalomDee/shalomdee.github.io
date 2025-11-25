// Project rendering functionality
class ProjectRenderer {
    constructor() {
        this.projectGrid = document.querySelector('.project-grid');
        this.svgIcons = {
            github: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>`,
            design: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.5 8.5H15.51M10.5 7.5H10.51M7.5 11.5H7.51M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 13.6569 19.6569 15 18 15H17.4C17.0284 15 16.8426 15 16.6871 15.0246C15.8313 15.1602 15.1602 15.8313 15.0246 16.6871C15 16.8426 15 17.0284 15 17.4V18C15 19.6569 13.6569 21 12 21Z"/>
                <circle cx="15.5" cy="8.5" r="0.5"/>
                <circle cx="10.5" cy="7.5" r="0.5"/>
                <circle cx="7.5" cy="11.5" r="0.5"/>
            </svg>`,
            'case-study': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.5 8.5H15.51M10.5 7.5H10.51M7.5 11.5H7.51M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 13.6569 19.6569 15 18 15H17.4C17.0284 15 16.8426 15 16.6871 15.0246C15.8313 15.1602 15.1602 15.8313 15.0246 16.6871C15 16.8426 15 17.0284 15 17.4V18C15 19.6569 13.6569 21 12 21Z"/>
                <circle cx="15.5" cy="8.5" r="0.5"/>
                <circle cx="10.5" cy="7.5" r="0.5"/>
                <circle cx="7.5" cy="11.5" r="0.5"/>
            </svg>`
        };
    }

    renderProject(project) {
        const linksHTML = project.links.map(link => {
            const icon = this.svgIcons[link.type] || this.svgIcons.github;
            return `<a href="${link.url}" aria-label="${link.label}">${icon}</a>`;
        }).join('');

        const techListHTML = project.technologies.map(tech => 
            `<li>${tech}</li>`
        ).join('');

        const titleHTML = project.links.length > 0 && project.links[0].type === 'github'
            ? `<a href="${project.links[0].url}">${project.title}</a>`
            : project.title;

        return `
            <div class="project" data-category="${project.category}">
                <div class="project-content">
                    <div>
                        <p class="project-overline">${project.overline}</p>
                        <h3 class="project-title">${titleHTML}</h3>
                        <div class="project-description">
                            <p>${project.description}</p>
                        </div>
                        <ul class="project-tech-list">
                            ${techListHTML}
                        </ul>
                        <div class="project-links">
                            ${linksHTML}
                        </div>
                    </div>
                </div>
                <div class="project-image">
                    <img src="${project.image}" alt="${project.title}">
                </div>
            </div>
        `;
    }

    async loadAndRender() {
        try {
            const response = await fetch('./js/projects-data.json');
            const data = await response.json();
            
            if (!this.projectGrid) {
                console.error('Project grid container not found');
                return;
            }

            const projectsHTML = data.projects.map(project => this.renderProject(project)).join('');
            this.projectGrid.innerHTML = projectsHTML;

            // Trigger custom event when projects are loaded
            document.dispatchEvent(new CustomEvent('projectsLoaded'));
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }
}

// Initialize renderer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const renderer = new ProjectRenderer();
        renderer.loadAndRender();
    });
} else {
    const renderer = new ProjectRenderer();
    renderer.loadAndRender();
}