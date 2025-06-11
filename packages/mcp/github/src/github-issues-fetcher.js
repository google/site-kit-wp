/**
 * GitHub API client for fetching issues from google/site-kit-wp repository.
 *
 * @since n.e.x.t
 */
class GitHubIssuesFetcher {
	constructor() {
		this.baseURL = 'https://api.github.com';
		this.owner = 'google';
		this.repo = 'site-kit-wp';
	}

	/**
	 * Fetch a single issue by number.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} issueNumber The issue number to fetch.
	 * @param {string} [token]     Optional GitHub API token for higher rate limits.
	 * @return {Promise<Object>} The issue data.
	 */
	async fetchIssue( issueNumber, token = null ) {
		const url = `${ this.baseURL }/repos/${ this.owner }/${ this.repo }/issues/${ issueNumber }`;
		const headers = {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'site-kit-mcp-github/1.0.0',
		};

		if ( token ) {
			headers.Authorization = `Bearer ${ token }`;
		}

		try {
			const response = await fetch( url, { headers } );

			if ( ! response.ok ) {
				if ( response.status === 404 ) {
					throw new Error(
						`Issue #${ issueNumber } not found in ${ this.owner }/${ this.repo }`
					);
				}
				if ( response.status === 403 ) {
					throw new Error(
						'GitHub API rate limit exceeded. Consider providing a GitHub token.'
					);
				}
				throw new Error(
					`GitHub API error: ${ response.status } ${ response.statusText }`
				);
			}

			const issue = await response.json();

			// Transform the issue data to include only relevant information
			return {
				number: issue.number,
				title: issue.title,
				body: issue.body,
				state: issue.state,
				created_at: issue.created_at,
				updated_at: issue.updated_at,
				closed_at: issue.closed_at,
				author: issue.user?.login,
				assignees:
					issue.assignees?.map( ( assignee ) => assignee.login ) ||
					[],
				labels:
					issue.labels?.map( ( label ) => ( {
						name: label.name,
						color: label.color,
						description: label.description,
					} ) ) || [],
				milestone: issue.milestone
					? {
							title: issue.milestone.title,
							description: issue.milestone.description,
							state: issue.milestone.state,
							due_on: issue.milestone.due_on,
					  }
					: null,
				comments_count: issue.comments,
				html_url: issue.html_url,
				api_url: issue.url,
			};
		} catch ( error ) {
			if ( error.message.includes( 'fetch' ) ) {
				throw new Error(
					'Network error: Unable to connect to GitHub API'
				);
			}
			throw error;
		}
	}

	/**
	 * Fetch multiple issues with filters.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} options Filtering options.
	 * @param {string} [token] Optional GitHub API token.
	 * @return {Promise<Array>} Array of issue data.
	 */
	async fetchIssues( options = {}, token = null ) {
		const {
			state = 'open',
			labels = '',
			sort = 'created',
			direction = 'desc',
			per_page = 30,
			page = 1,
		} = options;

		const params = new URLSearchParams( {
			state,
			sort,
			direction,
			per_page: per_page.toString(),
			page: page.toString(),
		} );

		if ( labels ) {
			params.append( 'labels', labels );
		}

		const url = `${ this.baseURL }/repos/${ this.owner }/${ this.repo }/issues?${ params }`;
		const headers = {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'site-kit-mcp-github/1.0.0',
		};

		if ( token ) {
			headers.Authorization = `Bearer ${ token }`;
		}

		try {
			const response = await fetch( url, { headers } );

			if ( ! response.ok ) {
				if ( response.status === 403 ) {
					throw new Error(
						'GitHub API rate limit exceeded. Consider providing a GitHub token.'
					);
				}
				throw new Error(
					`GitHub API error: ${ response.status } ${ response.statusText }`
				);
			}

			const issues = await response.json();

			return issues.map( ( issue ) => ( {
				number: issue.number,
				title: issue.title,
				body:
					issue.body?.substring( 0, 500 ) +
					( issue.body?.length > 500 ? '...' : '' ), // Truncate body for list view
				state: issue.state,
				created_at: issue.created_at,
				updated_at: issue.updated_at,
				closed_at: issue.closed_at,
				author: issue.user?.login,
				assignees:
					issue.assignees?.map( ( assignee ) => assignee.login ) ||
					[],
				labels: issue.labels?.map( ( label ) => label.name ) || [],
				comments_count: issue.comments,
				html_url: issue.html_url,
			} ) );
		} catch ( error ) {
			if ( error.message.includes( 'fetch' ) ) {
				throw new Error(
					'Network error: Unable to connect to GitHub API'
				);
			}
			throw error;
		}
	}
}

module.exports = { GitHubIssuesFetcher };
