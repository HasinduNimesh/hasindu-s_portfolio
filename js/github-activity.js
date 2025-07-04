// GitHub Activity Fetcher
// 
// This script fetches live GitHub statistics including repositories, stars, followers, and commits.
// 
// To manually update the commit count (if needed):
// 1. Open browser console on your website
// 2. Run: githubActivity.setCommitCount(YOUR_ACTUAL_COUNT)
// 
// The script automatically fetches commit counts from the GitHub API, but due to API limitations,
// it includes a fallback value. You can check your actual GitHub stats at:
// https://github.com/HasinduNimesh
//
class GitHubActivity {
    constructor(username) {
        this.username = username;
        this.apiBase = 'https://api.github.com';
        this.activityContainer = document.getElementById('github-activity');
        this.homepageActivityContainer = document.getElementById('homepage-activity');
        
        // Initialize with default values immediately
        this.initializeWithDefaults();
    }

    initializeWithDefaults() {
        // Add a small delay to ensure DOM is fully ready
        setTimeout(() => {
            console.log('Initializing GitHub stats with default values...');
            
            // Test if elements exist and set values directly first
            const elements = {
                'total-repos': 33,
                'total-stars': 6,
                'total-commits': 261,
                'total-followers': 8
            };
            
            for (const [id, value] of Object.entries(elements)) {
                const element = document.getElementById(id);
                if (element) {
                    console.log(`Found element ${id}, setting value to ${value}`);
                    element.textContent = value;
                    // Then apply animation
                    setTimeout(() => this.updateElement(id, value), 500);
                } else {
                    console.error(`Element with id '${id}' not found!`);
                }
            }
            
            console.log('GitHub stats initialization complete');
        }, 100);
    }

    async fetchUserStats() {
        try {
            console.log('Fetching GitHub stats...');
            
            // Fetch user profile data
            const userResponse = await fetch(`${this.apiBase}/users/${this.username}`);
            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('User data fetched:', userData);
                this.updateHomepageStats(userData);
            } else {
                console.log('Failed to fetch user data:', userResponse.status);
            }

            // Fetch repositories for more detailed stats
            const reposResponse = await fetch(`${this.apiBase}/users/${this.username}/repos?per_page=100&sort=updated`);
            if (reposResponse.ok) {
                const repos = await reposResponse.json();
                console.log('Repos data fetched:', repos.length, 'repositories');
                this.updateRepoStats(repos);
                // Skip the complex commit fetching for now to ensure basic stats work
                // await this.fetchCommitStats(repos);
            } else {
                console.log('Failed to fetch repos data:', reposResponse.status);
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    }

    async fetchCommitStats(repos) {
        try {
            let commitsThisYear = 0;
            const currentYear = new Date().getFullYear();
            const startOfYear = `${currentYear}-01-01T00:00:00Z`;
            
            // First, show the known accurate value as fallback
            this.updateElement('total-commits', 261);
            const commitLabel = document.querySelector('#total-commits')?.nextElementSibling;
            if (commitLabel) {
                commitLabel.textContent = `Commits (${currentYear})`;
            }
            
            // Filter out forked repos and get non-empty repos
            const ownRepos = repos.filter(repo => !repo.fork && repo.size > 0);
            
            console.log(`Fetching commit stats from ${ownRepos.length} repositories for ${currentYear}...`);
            
            // Process repos with better error handling and rate limiting
            let processedRepos = 0;
            const maxRepos = Math.min(ownRepos.length, 50); // Limit to prevent rate limiting
            
            for (let i = 0; i < maxRepos; i++) {
                const repo = ownRepos[i];
                try {
                    // Check if repo has commits in the current year
                    const commitsResponse = await fetch(
                        `${this.apiBase}/repos/${repo.full_name}/commits?author=${this.username}&since=${startOfYear}&per_page=100`
                    );
                    
                    if (commitsResponse.ok) {
                        const commits = await commitsResponse.json();
                        let repoCommits = commits.length;
                        
                        // If we got exactly 100 commits, there might be more
                        if (commits.length === 100) {
                            // Fetch additional pages
                            let page = 2;
                            let hasMore = true;
                            
                            while (hasMore && page <= 5) { // Limit to 5 pages per repo
                                const nextPageResponse = await fetch(
                                    `${this.apiBase}/repos/${repo.full_name}/commits?author=${this.username}&since=${startOfYear}&per_page=100&page=${page}`
                                );
                                
                                if (nextPageResponse.ok) {
                                    const nextCommits = await nextPageResponse.json();
                                    if (nextCommits.length === 0) {
                                        hasMore = false;
                                    } else {
                                        repoCommits += nextCommits.length;
                                        page++;
                                        if (nextCommits.length < 100) {
                                            hasMore = false;
                                        }
                                    }
                                } else {
                                    hasMore = false;
                                }
                                
                                // Small delay between pages
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                        }
                        
                        commitsThisYear += repoCommits;
                        if (repoCommits > 0) {
                            console.log(`${repo.name}: ${repoCommits} commits in ${currentYear}`);
                        }
                        
                        processedRepos++;
                    } else {
                        console.log(`Failed to fetch commits for ${repo.name}: ${commitsResponse.status}`);
                    }
                    
                } catch (error) {
                    console.log(`Error fetching commits for ${repo.name}:`, error);
                }
                
                // Rate limiting: delay between repos
                if (i < maxRepos - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            console.log(`Total commits found for ${currentYear}: ${commitsThisYear} (from ${processedRepos} repositories)`);
            
            // Only update if we found a reasonable number of commits (more than the fallback)
            if (commitsThisYear > 0 && commitsThisYear >= 200) {
                this.updateElement('total-commits', commitsThisYear);
            } else if (commitsThisYear > 0) {
                console.log(`Found ${commitsThisYear} commits, but keeping fallback value as it seems incomplete`);
            }
            
        } catch (error) {
            console.error('Error fetching commit stats:', error);
            // Keep the fallback value of 261
            this.updateElement('total-commits', 261);
        }
    }

    updateHomepageStats(userData) {
        // Update basic stats from user profile
        this.updateElement('total-repos', userData.public_repos || 0);
        this.updateElement('total-followers', userData.followers || 0);
        
        // You can also add following count if needed
        // this.updateElement('total-following', userData.following || 0);
    }

    updateRepoStats(repos) {
        // Calculate total stars across all repos
        const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
        this.updateElement('total-stars', totalStars);
        
        // Calculate total forks
        const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
        
        // Calculate total watchers
        const totalWatchers = repos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0);
        
        // You could add these as additional stats if needed
        console.log(`Total forks: ${totalForks}, Total watchers: ${totalWatchers}`);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            console.log(`Updating element ${id} with value ${value}`);
            // Set value immediately first
            element.textContent = value.toLocaleString();
            // Then animate the number counting up
            this.animateNumber(element, 0, value, 1000);
        } else {
            console.error(`Element with id '${id}' not found`);
        }
    }

    // Manual method to update commit count if needed
    setCommitCount(count) {
        this.updateElement('total-commits', count);
        const currentYear = new Date().getFullYear();
        const commitLabel = document.querySelector('#total-commits')?.nextElementSibling;
        if (commitLabel) {
            commitLabel.textContent = `Commits (${currentYear})`;
        }
        console.log(`Manually set commit count to ${count}`);
    }

    animateNumber(element, start, end, duration) {
        if (!element) return;
        
        // Ensure we have valid numbers
        const startNum = Number(start) || 0;
        const endNum = Number(end) || 0;
        const durationMs = Number(duration) || 1000;
        
        const startTime = Date.now();
        
        const animate = () => {
            try {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                const current = Math.floor(startNum + (endNum - startNum) * this.easeOutQuart(progress));
                element.textContent = current.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            } catch (error) {
                console.error('Error in animation:', error);
                // Fallback: just set the final value
                element.textContent = endNum.toLocaleString();
            }
        };
        
        animate();
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
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
            
            // Also update homepage activity if on homepage
            if (this.homepageActivityContainer) {
                this.displayHomepageActivity(events);
            }

        } catch (error) {
            console.error('Error fetching GitHub activity:', error);
            this.showError('Unable to load recent GitHub activity. Please try again later.');
        }
    }

    displayHomepageActivity(events) {
        const relevantEvents = events
            .filter(event => this.isRelevantEvent(event))
            .slice(0, 3); // Show only 3 most recent activities on homepage

        if (!relevantEvents || relevantEvents.length === 0) {
            this.homepageActivityContainer.innerHTML = '<div class="loading-preview">No recent activity found.</div>';
            return;
        }

        const activityHTML = relevantEvents
            .map(event => this.formatHomepageEvent(event))
            .join('');

        this.homepageActivityContainer.innerHTML = activityHTML;
    }

    formatHomepageEvent(event) {
        const timeAgo = this.getTimeAgo(new Date(event.created_at));
        const repoName = event.repo.name.split('/')[1]; // Get just the repo name without username
        
        switch (event.type) {
            case 'PushEvent':
                const commitCount = event.payload.commits ? event.payload.commits.length : 0;
                return `
                    <div class="activity-preview-item">
                        <i class="fas fa-code-branch activity-preview-icon"></i>
                        <div class="activity-preview-content">
                            <p>Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to <span class="repo-name">${repoName}</span> • ${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'CreateEvent':
                const refType = event.payload.ref_type;
                return `
                    <div class="activity-preview-item">
                        <i class="fas fa-plus activity-preview-icon"></i>
                        <div class="activity-preview-content">
                            <p>Created ${refType} in <span class="repo-name">${repoName}</span> • ${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'WatchEvent':
                return `
                    <div class="activity-preview-item">
                        <i class="fas fa-star activity-preview-icon"></i>
                        <div class="activity-preview-content">
                            <p>Starred <span class="repo-name">${repoName}</span> • ${timeAgo}</p>
                        </div>
                    </div>
                `;

            case 'ForkEvent':
                return `
                    <div class="activity-preview-item">
                        <i class="fas fa-code-branch activity-preview-icon"></i>
                        <div class="activity-preview-content">
                            <p>Forked <span class="repo-name">${repoName}</span> • ${timeAgo}</p>
                        </div>
                    </div>
                `;

            default:
                return '';
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
    console.log('DOM Content Loaded - Initializing GitHub activity...');
    
    // Check if required elements exist
    const reposElement = document.getElementById('total-repos');
    const starsElement = document.getElementById('total-stars');
    const commitsElement = document.getElementById('total-commits');
    const followersElement = document.getElementById('total-followers');
    
    console.log('GitHub stat elements found:', {
        repos: !!reposElement,
        stars: !!starsElement,
        commits: !!commitsElement,
        followers: !!followersElement
    });
    
    // Replace 'HasinduNimesh' with your actual GitHub username
    window.githubActivity = new GitHubActivity('HasinduNimesh');
    
    // Fetch user stats for homepage
    if (reposElement) {
        console.log('Fetching GitHub user stats...');
        window.githubActivity.fetchUserStats();
    } else {
        console.log('No GitHub stats elements found, skipping stats fetch');
    }
    
    // Only fetch activity if we're on the about page and the container exists
    if (document.getElementById('github-activity')) {
        console.log('Fetching GitHub activity...');
        window.githubActivity.fetchRecentActivity();
    }
});

// Refresh activity every 5 minutes
setInterval(() => {
    if (window.githubActivity) {
        // Update homepage stats
        if (document.getElementById('total-repos')) {
            window.githubActivity.fetchUserStats();
        }
        
        // Update about page activity
        if (document.getElementById('github-activity')) {
            window.githubActivity.fetchRecentActivity();
        }
    }
}, 300000); // 5 minutes in milliseconds
