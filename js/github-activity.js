// GitHub Activity Fetcher
class GitHubActivity {
    constructor(username) {
        this.username = username;
        this.apiBase = 'https://api.github.com';
        this.activityContainer = document.getElementById('github-activity');
    }

    async fetchRecentActivity() {
        try {
            // Show loading state
            this.showLoading();

            // Fetch recent events
            const eventsResponse = await fetch(`${this.apiBase}/users/${this.username}/events/public?per_page=10`);
            
            if (!eventsResponse.ok) {
                throw new Error('Failed to fetch GitHub activity');
            }

            const events = await eventsResponse.json();
            this.displayActivity(events);

        } catch (error) {
            console.error('Error fetching GitHub activity:', error);
            this.showError('Unable to load recent GitHub activity. Please try again later.');
        }
    }

    showLoading() {
        this.activityContainer.innerHTML = '<div class="loading">Loading recent activity...</div>';
    }

    showError(message) {
        this.activityContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }

    displayActivity(events) {
        if (!events || events.length === 0) {
            this.activityContainer.innerHTML = '<div class="loading">No recent activity found.</div>';
            return;
        }

        const activityHTML = events
            .filter(event => this.isRelevantEvent(event))
            .slice(0, 8) // Show only 8 most recent activities
            .map(event => this.formatEvent(event))
            .join('');

        this.activityContainer.innerHTML = activityHTML || '<div class="loading">No recent activity to display.</div>';
    }

    isRelevantEvent(event) {
        const relevantTypes = [
            'PushEvent',
            'CreateEvent',
            'PublicEvent',
            'ForkEvent',
            'WatchEvent',
            'IssuesEvent',
            'PullRequestEvent',
            'ReleaseEvent'
        ];
        return relevantTypes.includes(event.type);
    }

    formatEvent(event) {
        const timeAgo = this.getTimeAgo(new Date(event.created_at));
        const repoName = event.repo.name;
        
        switch (event.type) {
            case 'PushEvent':
                const commitCount = event.payload.commits ? event.payload.commits.length : 0;
                const latestCommit = event.payload.commits && event.payload.commits.length > 0 
                    ? event.payload.commits[0].message 
                    : '';
                return `
                    <div class="activity-item">
                        <i class="fas fa-code-branch activity-icon"></i>
                        <div class="activity-content">
                            <h4>Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                            ${latestCommit ? `<p class="commit-message">"${latestCommit}"</p>` : ''}
                        </div>
                    </div>
                `;

            case 'CreateEvent':
                const refType = event.payload.ref_type;
                const refName = event.payload.ref || '';
                return `
                    <div class="activity-item">
                        <i class="fas fa-plus activity-icon"></i>
                        <div class="activity-content">
                            <h4>Created ${refType} ${refName ? `"${refName}"` : ''} in <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'ForkEvent':
                return `
                    <div class="activity-item">
                        <i class="fas fa-code-branch activity-icon"></i>
                        <div class="activity-content">
                            <h4>Forked <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'WatchEvent':
                return `
                    <div class="activity-item">
                        <i class="fas fa-star activity-icon"></i>
                        <div class="activity-content">
                            <h4>Starred <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'PublicEvent':
                return `
                    <div class="activity-item">
                        <i class="fas fa-globe activity-icon"></i>
                        <div class="activity-content">
                            <h4>Made <span class="repo-name">${repoName}</span> public</h4>
                            <p>${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'IssuesEvent':
                const action = event.payload.action;
                const issueTitle = event.payload.issue ? event.payload.issue.title : '';
                return `
                    <div class="activity-item">
                        <i class="fas fa-exclamation-circle activity-icon"></i>
                        <div class="activity-content">
                            <h4>${action.charAt(0).toUpperCase() + action.slice(1)} issue in <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                            ${issueTitle ? `<p class="commit-message">"${issueTitle}"</p>` : ''}
                        </div>
                    </div>
                `;

            case 'PullRequestEvent':
                const prAction = event.payload.action;
                const prTitle = event.payload.pull_request ? event.payload.pull_request.title : '';
                return `
                    <div class="activity-item">
                        <i class="fas fa-git-alt activity-icon"></i>
                        <div class="activity-content">
                            <h4>${prAction.charAt(0).toUpperCase() + prAction.slice(1)} pull request in <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                            ${prTitle ? `<p class="commit-message">"${prTitle}"</p>` : ''}
                        </div>
                    </div>
                `;

            case 'ReleaseEvent':
                const releaseName = event.payload.release ? event.payload.release.name : '';
                const tagName = event.payload.release ? event.payload.release.tag_name : '';
                return `
                    <div class="activity-item">
                        <i class="fas fa-tag activity-icon"></i>
                        <div class="activity-content">
                            <h4>Released ${releaseName || tagName} in <span class="repo-name">${repoName}</span></h4>
                            <p>${timeAgo}</p>
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} month${months !== 1 ? 's' : ''} ago`;
        }
    }
}

// Initialize GitHub activity when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Replace 'HasinduNimesh' with your actual GitHub username
    const githubActivity = new GitHubActivity('HasinduNimesh');
    
    // Only fetch activity if we're on the about page and the container exists
    if (document.getElementById('github-activity')) {
        githubActivity.fetchRecentActivity();
    }
});

// Refresh activity every 5 minutes
setInterval(() => {
    if (document.getElementById('github-activity')) {
        const githubActivity = new GitHubActivity('HasinduNimesh');
        githubActivity.fetchRecentActivity();
    }
}, 300000); // 5 minutes in milliseconds
